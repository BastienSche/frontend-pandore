import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const AudioPlayerContext = createContext();

export const AudioPlayerProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(new Audio());

  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

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
      playTrack,
      pause,
      seek
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