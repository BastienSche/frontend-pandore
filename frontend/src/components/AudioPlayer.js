import React from 'react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const AudioPlayer = () => {
  const { currentTrack, isPlaying, currentTime, duration, playTrack, pause, seek } = useAudioPlayer();

  if (!currentTrack) return null;

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    seek(time);
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl"
        data-testid="audio-player"
      >
        <div className="glass-heavy rounded-3xl p-4 md:p-5 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          {/* Progress Bar - Top */}
          <div className="absolute top-0 left-6 right-6 h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            {/* Track Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {currentTrack.cover_url && (
                <motion.div
                  animate={{ rotate: isPlaying ? 360 : 0 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="relative"
                >
                  <img
                    src={currentTrack.cover_url}
                    alt={currentTrack.title}
                    className="w-14 h-14 md:w-16 md:h-16 rounded-2xl object-cover shadow-lg"
                  />
                  {isPlaying && (
                    <div className="absolute inset-0 rounded-2xl border-2 border-cyan-500/50 animate-pulse" />
                  )}
                </motion.div>
              )}
              <div className="min-w-0">
                <h4 
                  className="font-semibold text-sm md:text-base truncate"
                  data-testid="player-track-title"
                >
                  {currentTrack.title}
                </h4>
                <p 
                  className="text-xs md:text-sm text-muted-foreground truncate"
                  data-testid="player-artist-name"
                >
                  {currentTrack.artist_name}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 md:gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full w-10 h-10 hover:bg-white/10"
                data-testid="player-previous-button"
              >
                <SkipBack className="w-5 h-5" />
              </Button>
              
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  variant="default"
                  size="icon"
                  className="rounded-full w-14 h-14 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 border-0 shadow-[0_0_25px_rgba(34,211,238,0.4)]"
                  onClick={() => isPlaying ? pause() : playTrack(currentTrack)}
                  data-testid="player-play-pause-button"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white ml-0.5" />
                  )}
                </Button>
              </motion.div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full w-10 h-10 hover:bg-white/10"
                data-testid="player-next-button"
              >
                <SkipForward className="w-5 h-5" />
              </Button>
            </div>

            {/* Time & Seek */}
            <div className="hidden md:flex items-center gap-3 flex-1 max-w-xs">
              <span className="text-xs text-muted-foreground w-10 text-right font-mono">
                {formatTime(currentTime)}
              </span>
              <div className="flex-1 relative group">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                  data-testid="player-progress-bar"
                />
              </div>
              <span className="text-xs text-muted-foreground w-10 font-mono">
                {formatTime(duration)}
              </span>
            </div>

            {/* Volume */}
            <div className="hidden lg:flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full w-8 h-8 hover:bg-white/10"
              >
                <Volume2 className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {/* Mobile Time Display */}
          <div className="md:hidden flex justify-between text-xs text-muted-foreground mt-3 px-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AudioPlayer;
