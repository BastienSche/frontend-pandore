import React, { useEffect, useRef, useState } from 'react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { Play, Pause, SkipBack, SkipForward, Volume2, Library } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

const AUDIO_PLAYER_POS_KEY = 'kloud:audioPlayerPos:v1';
const LEGACY_AUDIO_PLAYER_POS_KEY = 'pandore:audioPlayerPos:v1';

const AudioPlayer = () => {
  const { currentTrack, isPlaying, currentTime, duration, playTrack, pause, seek, next, prev, volume, setVolume, playbackMode } = useAudioPlayer();
  const constraintsRef = useRef(null);
  const [savedPos, setSavedPos] = useState({ x: 0, y: 0 });
  const dragControls = useDragControls();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUDIO_PLAYER_POS_KEY) || localStorage.getItem(LEGACY_AUDIO_PLAYER_POS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
        setSavedPos({ x: parsed.x, y: parsed.y });
      }
    } catch {
      // ignore
    }
  }, []);

  if (!currentTrack) return null;

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <AnimatePresence>
      <div ref={constraintsRef} className="fixed inset-0 z-50 pointer-events-none">
        {/* Center with flex so Framer `x`/`y` drag offsets do not replace Tailwind’s -translate-x-1/2 (which skewed the bar right). */}
        <div className="pointer-events-none fixed bottom-6 left-0 right-0 z-50 flex justify-center px-3 sm:px-4">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="pointer-events-auto w-full max-w-4xl"
            data-testid="audio-player"
            drag
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={constraintsRef}
            dragMomentum={false}
            dragElastic={0.08}
            dragTransition={{ bounceStiffness: 600, bounceDamping: 30 }}
            style={{ x: savedPos.x, y: savedPos.y }}
            onDragEnd={(_, info) => {
              try {
                setSavedPos((prev) => {
                  const nextPos = { x: prev.x + info.offset.x, y: prev.y + info.offset.y };
                  localStorage.setItem(AUDIO_PLAYER_POS_KEY, JSON.stringify(nextPos));
                  return nextPos;
                });
              } catch {
                // ignore
              }
            }}
          >
          <div className="glass-heavy rounded-3xl p-4 md:p-5 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <div
              className="absolute left-0 right-0 top-0 h-6 cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
              aria-hidden="true"
            />
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
                {playbackMode === 'library' && (
                  <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-400/90" data-testid="player-library-mode">
                    <Library className="w-3 h-3" />
                    Fichier complet
                  </span>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 md:gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full w-10 h-10 hover:bg-white/10"
                data-testid="player-previous-button"
                onClick={prev}
              >
                <SkipBack className="w-5 h-5" />
              </Button>
              
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  variant="default"
                  size="icon"
                  className="rounded-full w-14 h-14 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 border-0 shadow-[0_0_25px_rgba(34,211,238,0.4)]"
                  onClick={() => (isPlaying ? pause() : playTrack(currentTrack))}
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
                onClick={next}
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
                <Slider
                  value={[currentTime]}
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  onValueChange={(v) => seek(v?.[0] ?? 0)}
                  className="w-full"
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
              <Slider
                value={[volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(v) => setVolume(v?.[0] ?? 0)}
                className="w-24"
                aria-label="Volume"
              />
            </div>
          </div>

          {/* Mobile Time Display */}
          <div className="md:hidden flex justify-between text-xs text-muted-foreground mt-3 px-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default AudioPlayer;
