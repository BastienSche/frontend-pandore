import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { recordTrackPlay } from '@/lib/recordPlay';
import { apiClient, getAccessToken, getRefreshToken, withAudioAccessToken } from '@/lib/apiClient';
import {
  SETTINGS_CHANGED_EVENT,
  readPlayerPrefs,
  saveLocalSettings,
  settingsFromApi,
} from '@/lib/accountSettings';

const AudioPlayerContext = createContext();

/** @typedef {'preview' | 'library'} PlaybackMode */

const inferPlaybackMode = (track) => (track?.file_url ? 'library' : 'preview');

const REPEAT_LS_KEY = 'kloud:playerRepeat';
const REPEAT_MODES = ['off', 'all', 'one'];

const readRepeatMode = () => {
  try {
    const raw = window.localStorage.getItem(REPEAT_LS_KEY);
    if (raw === 'all' || raw === 'one' || raw === 'off') return raw;
  } catch {
    // ignore
  }
  return 'off';
};

const resolveAudioUrl = (track, mode) => {
  if (mode === 'library' && track?.file_url) return withAudioAccessToken(track.file_url);
  // Catalogue : fichier réel d'abord — un clip preview périmé lançait un autre son.
  return track?.file_url || track?.preview_url || null;
};

const resolveStartTime = (track, mode) => {
  if (mode === 'library') return 0;
  return track?.preview_start_time ?? track?.preview_start_sec ?? 0;
};

/** Fenêtre d’écoute en mode browse (même URL que le fichier complet). */
const resolvePreviewDurationSec = (track) => {
  const v = track?.preview_duration ?? track?.preview_duration_sec ?? track?.preview_length_sec ?? track?.preview_seconds;
  if (v != null && Number.isFinite(Number(v)) && Number(v) > 0) return Number(v);
  return 15;
};

const cacheBustUrl = (url) => {
  if (!url) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}_r=${Date.now()}`;
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
  const [repeatMode, setRepeatModeState] = useState(readRepeatMode);
  /** Lecture extraite (browse) ou fichier complet (bibliothèque possédée) */
  const [playbackMode, setPlaybackMode] = useState('preview');
  const [volume, setVolume] = useState(0.9);
  const audioRef = useRef(new Audio());
  const currentTrackRef = useRef(null);
  const playbackModeRef = useRef('preview');
  const queueRef = useRef([]);
  const queueIndexRef = useRef(0);
  const repeatModeRef = useRef(readRepeatMode());
  const playRecordedForTrackRef = useRef(new Set());
  const playGenRef = useRef(0);
  const playTrackRef = useRef(null);
  const advanceFromEndRef = useRef(() => {});
  const prefsRef = useRef(readPlayerPrefs());
  const [normalizeVolume, setNormalizeVolume] = useState(() => readPlayerPrefs().normalizeVolume);

  useEffect(() => {
    const applyPrefs = (settings) => {
      const prefs = readPlayerPrefs(settings);
      prefsRef.current = prefs;
      setNormalizeVolume(prefs.normalizeVolume);
      audioRef.current.preload = prefs.highQualityStreaming ? 'auto' : 'metadata';
    };

    applyPrefs();

    const loadRemote = async () => {
      if (!getAccessToken() && !getRefreshToken()) return;
      try {
        const { data } = await apiClient.get('/api/users/me/settings');
        const next = settingsFromApi(data);
        saveLocalSettings(next);
        applyPrefs(next);
      } catch {
        applyPrefs();
      }
    };
    loadRemote();

    const onChanged = (event) => {
      applyPrefs(event?.detail);
    };
    const onAuth = () => {
      if (!getAccessToken() && !getRefreshToken()) {
        applyPrefs();
        return;
      }
      loadRemote();
    };
    window.addEventListener(SETTINGS_CHANGED_EVENT, onChanged);
    window.addEventListener('kloud-auth-changed', onAuth);
    window.addEventListener('pandore-auth-changed', onAuth);
    return () => {
      window.removeEventListener(SETTINGS_CHANGED_EVENT, onChanged);
      window.removeEventListener('kloud-auth-changed', onAuth);
      window.removeEventListener('pandore-auth-changed', onAuth);
    };
  }, []);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  useEffect(() => {
    playbackModeRef.current = playbackMode;
  }, [playbackMode]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    queueIndexRef.current = queueIndex;
  }, [queueIndex]);

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  const startUrl = async (url, startTime, { allowRetry = true } = {}) => {
    const audio = audioRef.current;
    const gen = ++playGenRef.current;
    try {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    } catch {
      /* ignore */
    }
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
      const err = audioRef.current?.error;
      console.error('[Kloud] lecture audio impossible', { url, code: err?.code, message: err?.message });
      toast.error('Impossible de lire ce son');
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
          if (repeatModeRef.current === 'one') {
            try {
              audio.currentTime = start;
            } catch {
              // ignore
            }
            audio.play().catch(() => {});
            return;
          }
          advanceFromEndRef.current?.();
        }
      }
    };
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      advanceFromEndRef.current?.();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    const factor = normalizeVolume ? 0.8 : 1;
    audioRef.current.volume = Math.max(0, Math.min(1, volume * factor));
  }, [volume, normalizeVolume]);

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

    const incomingId = String(track?.track_id || '').trim();
    const currentId = String(currentTrackRef.current?.track_id || '').trim();
    const sameTrack = Boolean(incomingId && incomingId === currentId);
    const explicitMode = options.mode !== undefined;
    const mode = explicitMode
      ? (options.mode ?? inferPlaybackMode(track))
      : (sameTrack ? playbackModeRef.current : inferPlaybackMode(track));
    const url = resolveAudioUrl(track, mode);
    const startTime = resolveStartTime(track, mode);

    if (!options.fromQueue && !sameTrack) {
      setQueueState([track]);
      setQueueIndex(0);
    }

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

    if (!url) {
      toast.error('Aucun fichier audio pour ce titre');
      return;
    }

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

  const playQueueIndex = (index, tracks = queueRef.current) => {
    const t = tracks[index];
    if (!t) return;
    setQueueIndex(index);
    playTrack(t, { mode: inferPlaybackMode(t), fromQueue: true });
  };

  const advanceFromEnd = () => {
    const q = queueRef.current;
    const i = queueIndexRef.current;
    const repeat = repeatModeRef.current;
    if (repeat === 'one' && q[i]) {
      playQueueIndex(i, q);
      return;
    }
    if (q.length > 1 && i < q.length - 1) {
      playQueueIndex(i + 1, q);
      return;
    }
    if (repeat === 'all' && q.length) {
      playQueueIndex(0, q);
      return;
    }
    const audio = audioRef.current;
    audio.pause();
    const tr = currentTrackRef.current;
    if (playbackModeRef.current === 'preview' && tr) {
      try {
        audio.currentTime = resolveStartTime(tr, 'preview');
      } catch {
        // ignore
      }
    }
    setIsPlaying(false);
    setCurrentTime(audio.currentTime || 0);
  };
  advanceFromEndRef.current = advanceFromEnd;

  const setQueue = (tracks, startIndex = 0, options = {}) => {
    const nextQueue = Array.isArray(tracks) ? tracks.filter(Boolean) : [];
    const idx = Math.max(0, Math.min(startIndex, Math.max(0, nextQueue.length - 1)));
    const startTrack = nextQueue[idx];
    const mode = options.mode ?? inferPlaybackMode(startTrack);
    setQueueState(nextQueue);
    setQueueIndex(idx);
    if (startTrack) playTrack(startTrack, { mode, fromQueue: true });
  };

  const addToQueue = (tracks) => {
    const incoming = (Array.isArray(tracks) ? tracks : [tracks]).filter(Boolean);
    if (!incoming.length) return;
    setQueueState((prev) => {
      const base = prev.length ? prev : (currentTrackRef.current ? [currentTrackRef.current] : []);
      if (!base.length) {
        const start = incoming[0];
        setQueueIndex(0);
        playTrack(start, { mode: inferPlaybackMode(start), fromQueue: true });
        return incoming;
      }
      return [...base, ...incoming];
    });
  };

  const removeFromQueue = (index) => {
    const q = queueRef.current;
    if (index < 0 || index >= q.length) return;
    const nextQueue = q.filter((_, i) => i !== index);
    const current = queueIndexRef.current;
    if (!nextQueue.length) {
      stopPlayback();
      return;
    }
    if (index === current) {
      const nextIdx = Math.min(index, nextQueue.length - 1);
      setQueueState(nextQueue);
      playQueueIndex(nextIdx, nextQueue);
      return;
    }
    setQueueState(nextQueue);
    if (index < current) setQueueIndex(current - 1);
  };

  const next = () => {
    const q = queueRef.current;
    const i = queueIndexRef.current;
    if (!q.length) return;
    if (i < q.length - 1) {
      playQueueIndex(i + 1, q);
      return;
    }
    if (repeatModeRef.current === 'all') {
      playQueueIndex(0, q);
    }
  };

  const prev = () => {
    const audio = audioRef.current;
    if ((audio.currentTime || 0) > 2) {
      try {
        audio.currentTime = playbackModeRef.current === 'preview'
          ? resolveStartTime(currentTrackRef.current, 'preview')
          : 0;
      } catch {
        // ignore
      }
      setCurrentTime(audio.currentTime || 0);
      return;
    }
    const q = queueRef.current;
    const i = queueIndexRef.current;
    if (!q.length) return;
    if (i > 0) {
      playQueueIndex(i - 1, q);
      return;
    }
    if (repeatModeRef.current === 'all' && q.length) {
      playQueueIndex(q.length - 1, q);
    }
  };

  const pause = () => {
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const togglePlay = () => {
    const track = currentTrackRef.current;
    if (!track) return;
    if (isPlaying) pause();
    else playTrack(track, { fromQueue: true });
  };

  const cycleRepeat = () => {
    setRepeatModeState((prev) => {
      const idx = REPEAT_MODES.indexOf(prev);
      const nextMode = REPEAT_MODES[(idx + 1) % REPEAT_MODES.length];
      try {
        window.localStorage.setItem(REPEAT_LS_KEY, nextMode);
      } catch {
        // ignore
      }
      return nextMode;
    });
  };

  const stopPlayback = () => {
    playGenRef.current += 1;
    const audio = audioRef.current;
    try {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    } catch {
      /* ignore */
    }
    setIsPlaying(false);
    setCurrentTrack(null);
    setCurrentTime(0);
    setDuration(0);
    setQueueState([]);
    setQueueIndex(0);
    setPlaybackMode('preview');
    currentTrackRef.current = null;
    playRecordedForTrackRef.current = new Set();
  };

  useEffect(() => {
    const onAuthChanged = () => {
      if (!getAccessToken() && !getRefreshToken() && playbackModeRef.current === 'library') {
        stopPlayback();
      }
    };
    window.addEventListener('kloud-auth-changed', onAuthChanged);
    window.addEventListener('pandore-auth-changed', onAuthChanged);
    return () => {
      window.removeEventListener('kloud-auth-changed', onAuthChanged);
      window.removeEventListener('pandore-auth-changed', onAuthChanged);
    };
  }, []);

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
      repeatMode,
      playbackMode,
      playTrack,
      pause,
      togglePlay,
      stopPlayback,
      seek,
      setQueue,
      addToQueue,
      removeFromQueue,
      playQueueIndex,
      cycleRepeat,
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
