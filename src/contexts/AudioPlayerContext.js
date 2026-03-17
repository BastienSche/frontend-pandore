import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const AudioPlayerContext = createContext();

export const AudioPlayerProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueueState] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const audioRef = useRef(new Audio());

  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      // auto-advance if queue is set
      if (queue.length && queueIndex < queue.length - 1) {
        const nextIndex = queueIndex + 1;
        setQueueIndex(nextIndex);
        const nextTrack = queue[nextIndex];
        if (nextTrack) {
          setCurrentTrack(nextTrack);
          audio.src = nextTrack.preview_url;
          audio.currentTime = nextTrack.preview_start_time || 0;
          audio.play();
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
  }, [queue, queueIndex]);

  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  const playTrack = (track) => {
    const audio = audioRef.current;
    
    if (currentTrack?.track_id === track.track_id && isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (currentTrack?.track_id !== track.track_id) {
        setCurrentTrack(track);
        audio.src = track.preview_url;
        audio.currentTime = track.preview_start_time || 0;
      }
      audio.play();
      setIsPlaying(true);
    }
  };

  const setQueue = (tracks, startIndex = 0) => {
    const nextQueue = Array.isArray(tracks) ? tracks : [];
    const idx = Math.max(0, Math.min(startIndex, Math.max(0, nextQueue.length - 1)));
    setQueueState(nextQueue);
    setQueueIndex(idx);
    const startTrack = nextQueue[idx];
    if (startTrack) playTrack(startTrack);
  };

  const next = () => {
    if (!queue.length) return;
    const nextIndex = Math.min(queueIndex + 1, queue.length - 1);
    if (nextIndex === queueIndex) return;
    setQueueIndex(nextIndex);
    const t = queue[nextIndex];
    if (t) playTrack(t);
  };

  const prev = () => {
    if (!queue.length) return;
    const prevIndex = Math.max(queueIndex - 1, 0);
    if (prevIndex === queueIndex) return;
    setQueueIndex(prevIndex);
    const t = queue[prevIndex];
    if (t) playTrack(t);
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