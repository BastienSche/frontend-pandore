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

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  useEffect(() => {
    playbackModeRef.current = playbackMode;
  }, [playbackMode]);

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
          const url = resolveAudioUrl(nextTrack, playbackMode);
          if (!url) {
            setIsPlaying(false);
            return;
          }
          setCurrentTrack(nextTrack);
          audio.src = url;
          audio.currentTime = resolveStartTime(nextTrack, playbackMode);
          audio.play().catch(() => setIsPlaying(false));
          setIsPlaying(true);
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
  }, [queue, queueIndex, playbackMode]);

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

    if (sameTrack && !explicitMode) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play().catch(() => setIsPlaying(false));
        setIsPlaying(true);
      }
      return;
    }

    const mode = explicitMode ? (options.mode ?? 'preview') : 'preview';
    const url = resolveAudioUrl(track, mode);
    if (!url) return;

    if (sameTrack && explicitMode) {
      const needReload = playbackMode !== mode || !audio.src;
      if (needReload) {
        setPlaybackMode(mode);
        audio.src = url;
        audio.currentTime = resolveStartTime(track, mode);
        audio.play().catch(() => setIsPlaying(false));
        setIsPlaying(true);
        return;
      }
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play().catch(() => setIsPlaying(false));
        setIsPlaying(true);
      }
      return;
    }

    setPlaybackMode(mode);
    setCurrentTrack(track);
    audio.src = url;
    audio.currentTime = resolveStartTime(track, mode);
    audio.play().catch(() => setIsPlaying(false));
    setIsPlaying(true);
  };

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
