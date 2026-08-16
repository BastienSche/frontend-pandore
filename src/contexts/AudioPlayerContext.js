import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { recordTrackPlay } from '@/lib/recordPlay';

const AudioPlayerContext = createContext();

/** @typedef {'preview' | 'library'} PlaybackMode */

const resolveAudioUrl = (track, mode) => {
  if (mode === 'library' && track?.file_url) return track.file_url;
  return track?.preview_url;
};

const resolveStartTime = (track, mode) => {
  if (mode === 'library') return 0;
  return track?.preview_start_time ?? track?.preview_start_sec ?? 0;
};

/** Fenêtre d’écoute en mode browse (même URL que le fichier complet). */
const resolvePreviewDurationSec = (track) => {
  const v = track?.preview_duration_sec ?? track?.preview_length_sec ?? track?.preview_seconds;
  if (v != null && Number.isFinite(Number(v)) && Number(v) > 0) return Number(v);
  return 15;
};

const cacheBustUrl = (url) => {
  if (!url) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}_r=${Date.now()}`;
};

const resolvedSrc = (url) => {
  try {
    return new URL(url, window.location.href).href;
  } catch {
    return url;
  }
};

/**
 * Load src, wait for metadata (needed for WAV), then seek and play.
 * Seeking immediately after assigning src poisons Chrome's media cache on WAVE files.
 */
const loadAndPlay = (audio, url, startTime, generation, generationRef) => {
  return new Promise((resolve, reject) => {
    let settled = false;
    const isStale = () => generationRef.current !== generation;

    const cleanup = () => {
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('error', onErr);
    };

    const finish = (fn) => {
      if (settled) return;
      settled = true;
      cleanup();
      fn();
    };

    const onMeta = () => {
      if (isStale()) {
        finish(resolve);
        return;
      }
      const start = Number(startTime) || 0;
      if (start > 0 && Number.isFinite(audio.duration) && audio.duration > 0) {
        try {
          audio.currentTime = Math.min(start, Math.max(0, audio.duration - 0.05));
        } catch {
          // ignore; play still proceeds from 0
        }
      }
      const playResult = audio.play();
      if (playResult && typeof playResult.then === 'function') {
        playResult.then(() => finish(resolve)).catch((err) => {
          if (err?.name === 'AbortError') {
            finish(resolve);
            return;
          }
          finish(() => reject(err));
        });
      } else {
        finish(resolve);
      }
    };

    const onErr = () => {
      finish(() => reject(audio.error || new Error('audio error')));
    };

    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('error', onErr);

    const nextSrc = resolvedSrc(url);
    if (audio.src === nextSrc && audio.readyState >= 1 && !audio.error) {
      onMeta();
      return;
    }
    audio.src = url;
    audio.load();
  });
};

export const AudioPlayerProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueueState] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  /** Lecture extraite (browse) ou fichier complet (bibliothèque possédée) */
  const [playbackMode, setPlaybackMode] = useState('preview');
  const [volume, setVolume] = useState(0.9);
  const audioRef = useRef(new Audio());
  const currentTrackRef = useRef(null);
  const playbackModeRef = useRef('preview');
  const playRecordedForTrackRef = useRef(new Set());
  const playGenRef = useRef(0);
  const playTrackRef = useRef(null);

  useEffect(() => {
    audioRef.current.preload = 'auto';
  }, []);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  useEffect(() => {
    playbackModeRef.current = playbackMode;
  }, [playbackMode]);

  const startUrl = async (url, startTime, { allowRetry = true } = {}) => {
    const audio = audioRef.current;
    const gen = ++playGenRef.current;
    try {
      await loadAndPlay(audio, url, startTime, gen, playGenRef);
      if (playGenRef.current !== gen) return;
      setIsPlaying(true);
    } catch {
      if (playGenRef.current !== gen) return;
      if (allowRetry) {
        try {
          await loadAndPlay(audio, cacheBustUrl(url), startTime, gen, playGenRef);
          if (playGenRef.current !== gen) return;
          setIsPlaying(true);
          return;
        } catch {
          // fall through
        }
      }
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      const t = audio.currentTime;
      setCurrentTime(t);

      const mode = playbackModeRef.current;
      const tr = currentTrackRef.current;
      if (mode === 'preview' && tr) {
        const start = resolveStartTime(tr, 'preview');
        const windowSec = resolvePreviewDurationSec(tr);
        const endUncapped = start + windowSec;
        const dur = audio.duration;
        const end =
          Number.isFinite(dur) && dur > 0 ? Math.min(endUncapped, dur) : endUncapped;
        if (t >= end - 0.05) {
          audio.pause();
          audio.currentTime = start;
          setIsPlaying(false);
        }
      }
    };
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (queue.length && queueIndex < queue.length - 1) {
        const nextIndex = queueIndex + 1;
        setQueueIndex(nextIndex);
        const nextTrack = queue[nextIndex];
        if (nextTrack) {
          playTrackRef.current?.(nextTrack, { mode: playbackModeRef.current });
          return;
        }
      }
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [queue, queueIndex]);

  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const tid = currentTrack?.track_id;
    if (!tid || !isPlaying) return;
    if (playRecordedForTrackRef.current.has(tid)) return;
    const audio = audioRef.current;
    const onPlaying = () => {
      if (playRecordedForTrackRef.current.has(tid)) return;
      playRecordedForTrackRef.current.add(tid);
      const mode = playbackModeRef.current;
      const tr = currentTrackRef.current;
      let durationSec = 15;
      if (mode === 'library') {
        const dur = audio.duration;
        durationSec =
          Number.isFinite(dur) && dur > 0 ? Math.min(7200, Math.round(dur)) : 180;
      } else if (tr) {
        durationSec = resolvePreviewDurationSec(tr);
      }
      recordTrackPlay(tid, durationSec);
      audio.removeEventListener('playing', onPlaying);
    };
    audio.addEventListener('playing', onPlaying);
    return () => audio.removeEventListener('playing', onPlaying);
  }, [currentTrack?.track_id, isPlaying]);

  const playTrack = (track, options = {}) => {
    const audio = audioRef.current;
    if (!track) return;

    const sameTrack = currentTrack?.track_id === track.track_id;
    const explicitMode = options.mode !== undefined;
    const mode = explicitMode ? (options.mode ?? 'preview') : (sameTrack ? playbackMode : 'preview');
    const url = resolveAudioUrl(track, mode);
    const startTime = resolveStartTime(track, mode);

    if (sameTrack && !explicitMode) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
        return;
      }
      if (audio.error || audio.readyState === 0) {
        if (url) startUrl(cacheBustUrl(url), startTime);
        return;
      }
      audio.play().then(() => setIsPlaying(true)).catch(() => {
        if (url) startUrl(cacheBustUrl(url), startTime, { allowRetry: false });
        else setIsPlaying(false);
      });
      setIsPlaying(true);
      return;
    }

    if (!url) return;

    if (sameTrack && explicitMode) {
      const needReload = playbackMode !== mode || !audio.src || audio.error;
      if (!needReload) {
        if (isPlaying) {
          audio.pause();
          setIsPlaying(false);
        } else {
          audio.play().then(() => setIsPlaying(true)).catch(() => {
            startUrl(cacheBustUrl(url), startTime, { allowRetry: false });
          });
          setIsPlaying(true);
        }
        return;
      }
    }

    setPlaybackMode(mode);
    setCurrentTrack(track);
    startUrl(url, startTime);
  };

  playTrackRef.current = playTrack;

  const setQueue = (tracks, startIndex = 0, options = {}) => {
    const nextQueue = Array.isArray(tracks) ? tracks : [];
    const idx = Math.max(0, Math.min(startIndex, Math.max(0, nextQueue.length - 1)));
    const mode = options.mode ?? 'preview';
    setQueueState(nextQueue);
    setQueueIndex(idx);
    const startTrack = nextQueue[idx];
    if (startTrack) playTrack(startTrack, { mode });
  };

  const next = () => {
    if (!queue.length) return;
    const nextIndex = Math.min(queueIndex + 1, queue.length - 1);
    if (nextIndex === queueIndex) return;
    setQueueIndex(nextIndex);
    const t = queue[nextIndex];
    if (t) playTrack(t, { mode: playbackMode });
  };

  const prev = () => {
    if (!queue.length) return;
    const prevIndex = Math.max(queueIndex - 1, 0);
    if (prevIndex === queueIndex) return;
    setQueueIndex(prevIndex);
    const t = queue[prevIndex];
    if (t) playTrack(t, { mode: playbackMode });
  };

  const pause = () => {
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const seek = (time) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  return (
    <AudioPlayerContext.Provider value={{
      currentTrack,
      isPlaying,
      currentTime,
      duration,
      queue,
      queueIndex,
      playbackMode,
      playTrack,
      pause,
      seek,
      setQueue,
      next,
      prev,
      volume,
      setVolume
    }}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  }
  return context;
};
