import React, { useEffect, useRef, useState } from 'react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { Play, Pause, SkipBack, SkipForward, Volume2, Library, ListMusic, Repeat, Repeat1, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import CoverImage from '@/components/CoverImage';

const AUDIO_PLAYER_POS_KEY = 'kloud:audioPlayerPos:v1';
const LEGACY_AUDIO_PLAYER_POS_KEY = 'pandore:audioPlayerPos:v1';

const AudioPlayer = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    seek,
    next,
    prev,
    volume,
    setVolume,
    playbackMode,
    queue,
    queueIndex,
    repeatMode,
    cycleRepeat,
    playQueueIndex,
    removeFromQueue
  } = useAudioPlayer();
  const constraintsRef = useRef(null);
  const playerShellRef = useRef(null);
  const [savedPos, setSavedPos] = useState({ x: 0, y: 0 });
  const [isMobileUi, setIsMobileUi] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const dragControls = useDragControls();
  const topBarRef = useRef(null);
  const scrubbingRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobileUi(mq.matches);
    update();
    if (mq.addEventListener) mq.addEventListener('change', update);
    else if (mq.addListener) mq.addListener(update);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', update);
      else if (mq.removeListener) mq.removeListener(update);
    };
  }, []);

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

  useEffect(() => {
    const isTyping = (el) => {
      if (!el || el === document.body) return false;
      const tag = String(el.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
      if (el.isContentEditable) return true;
      return false;
    };
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTyping(e.target)) return;
      if (!currentTrack) return;
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePlay();
        return;
      }
      if (e.target?.closest?.('[role="slider"]')) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentTrack, togglePlay, next, prev]);

  useEffect(() => {
    if (!queueOpen) return undefined;
    const onPointer = (e) => {
      if (playerShellRef.current && !playerShellRef.current.contains(e.target)) {
        setQueueOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [queueOpen]);

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!scrubbingRef.current) return;
      if (!topBarRef.current) return;
      if (!duration || duration <= 0) return;
      const rect = topBarRef.current.getBoundingClientRect();
      const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
      const ratio = rect.width > 0 ? x / rect.width : 0;
      seek(ratio * duration);
    };
    const handlePointerUp = () => {
      if (!scrubbingRef.current) return;
      scrubbingRef.current = false;
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [duration, seek]);

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
        <div className="pointer-events-none fixed bottom-[calc(6.25rem+env(safe-area-inset-bottom))] md:bottom-6 left-0 right-0 z-50 flex justify-center px-2 sm:px-4">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="pointer-events-auto w-full max-w-4xl"
            data-testid="audio-player"
            drag={!isMobileUi}
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={constraintsRef}
            dragMomentum={false}
            dragElastic={0.08}
            dragTransition={{ bounceStiffness: 600, bounceDamping: 30 }}
            style={isMobileUi ? { x: 0, y: 0 } : { x: savedPos.x, y: savedPos.y }}
            onDragEnd={(_, info) => {
              if (isMobileUi) return;
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
          <div ref={playerShellRef} className="glass-heavy rounded-3xl p-2.5 md:p-5 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative">
            <AnimatePresence>
              {queueOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute left-0 right-0 bottom-[calc(100%+0.6rem)] glass-heavy rounded-3xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.45)] overflow-hidden"
                  data-testid="player-queue-panel"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <div>
                      <p className="text-sm font-semibold">File d’attente</p>
                      <p className="text-[11px] text-muted-foreground">
                        {queue.length} titre{queue.length > 1 ? 's' : ''}
                        {repeatMode === 'one' ? ' · répétition du titre' : repeatMode === 'all' ? ' · répétition de la file' : ''}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-full w-8 h-8"
                      onClick={() => setQueueOpen(false)}
                      aria-label="Fermer la file"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="px-4 pb-2 text-[11px] text-muted-foreground">
                    Espace : lecture / pause · ← → : titre précédent / suivant
                  </p>
                  <ul className="max-h-[min(42vh,20rem)] overflow-y-auto py-1">
                    {queue.map((track, index) => {
                      const active = index === queueIndex;
                      return (
                        <li key={`${track?.track_id || 't'}-${index}`}>
                          <div
                            className={`flex items-center gap-2 px-2 py-1.5 ${
                              active ? 'bg-cyan-500/15' : 'hover:bg-white/5'
                            }`}
                          >
                            <button
                              type="button"
                              className="flex-1 min-w-0 flex items-center gap-3 text-left rounded-xl px-2 py-1"
                              onClick={() => playQueueIndex(index)}
                            >
                              <CoverImage
                                src={track.cover_url}
                                alt=""
                                className="w-9 h-9 rounded-lg shrink-0"
                              />
                              <span className="min-w-0 flex-1">
                                <span className={`block text-sm truncate ${active ? 'text-cyan-200' : ''}`}>
                                  {track.title || 'Sans titre'}
                                </span>
                                <span className="block text-[11px] text-muted-foreground truncate">
                                  {track.artist_name || ''}
                                </span>
                              </span>
                              {active ? (
                                <span className="text-[10px] uppercase tracking-wide text-cyan-300 shrink-0">
                                  {isPlaying ? 'En cours' : 'En pause'}
                                </span>
                              ) : (
                                <span className="text-[11px] text-muted-foreground w-5 text-right shrink-0">
                                  {index + 1}
                                </span>
                              )}
                            </button>
                            {queue.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="rounded-full w-8 h-8 shrink-0"
                                aria-label="Retirer de la file"
                                onClick={() => removeFromQueue(index)}
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
            <div
              className="absolute left-0 right-0 top-0 h-6 cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => {
                if (!isMobileUi) dragControls.start(e);
              }}
              aria-hidden="true"
            />
          {/* Progress Bar - Top */}
          <div
            ref={topBarRef}
            className="absolute top-0 left-6 right-6 h-2 -translate-y-0.5 cursor-pointer"
            onPointerDown={(e) => {
              if (!duration || duration <= 0) return;
              if (!topBarRef.current) return;
              scrubbingRef.current = true;
              try {
                e.currentTarget.setPointerCapture?.(e.pointerId);
              } catch {
                // ignore
              }
              const rect = topBarRef.current.getBoundingClientRect();
              const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
              const ratio = rect.width > 0 ? x / rect.width : 0;
              seek(ratio * duration);
            }}
            role="slider"
            aria-label="Progression"
            aria-valuemin={0}
            aria-valuemax={duration || 0}
            aria-valuenow={currentTime}
            tabIndex={0}
            onKeyDown={(e) => {
              if (!duration || duration <= 0) return;
              const stepSec = e.shiftKey ? 10 : 5;
              if (e.key === 'ArrowLeft') {
                e.preventDefault();
                seek(Math.max(0, currentTime - stepSec));
              }
              if (e.key === 'ArrowRight') {
                e.preventDefault();
                seek(Math.min(duration, currentTime + stepSec));
              }
            }}
            data-testid="player-top-progress-bar"
          >
            <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
            </div>
          </div>

          <div className="flex items-center gap-2.5 md:gap-6">
            {/* Track Info */}
            <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
              <motion.div
                animate={{ rotate: isPlaying ? 360 : 0 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="relative shrink-0"
              >
                <CoverImage
                  src={currentTrack.cover_url}
                  alt={currentTrack.title}
                  className="w-10 h-10 md:w-16 md:h-16 rounded-2xl shadow-lg"
                />
                {isPlaying && (
                  <div className="absolute inset-0 rounded-2xl border-2 border-cyan-500/50 animate-pulse" />
                )}
              </motion.div>
              <div className="min-w-0">
                <h4 
                  className="font-semibold text-xs sm:text-sm md:text-base truncate"
                  data-testid="player-track-title"
                >
                  {currentTrack.title}
                </h4>
                <p 
                  className="text-[11px] sm:text-xs md:text-sm text-muted-foreground truncate"
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
            <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full w-[1.875rem] h-[1.875rem] md:w-10 md:h-10 hover:bg-white/10"
                data-testid="player-previous-button"
                onClick={prev}
              >
                <SkipBack className="w-[0.95rem] h-[0.95rem] md:w-5 md:h-5" />
              </Button>
              
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  variant="default"
                  size="icon"
                  className="rounded-full w-10 h-10 md:w-14 md:h-14 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 border-0 shadow-[0_0_25px_rgba(34,211,238,0.4)]"
                  onClick={togglePlay}
                  data-testid="player-play-pause-button"
                >
                  {isPlaying ? (
                    <Pause className="w-[1.125rem] h-[1.125rem] md:w-6 md:h-6 text-white" />
                  ) : (
                    <Play className="w-[1.125rem] h-[1.125rem] md:w-6 md:h-6 text-white ml-0.5" />
                  )}
                </Button>
              </motion.div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full w-[1.875rem] h-[1.875rem] md:w-10 md:h-10 hover:bg-white/10"
                data-testid="player-next-button"
                onClick={next}
              >
                <SkipForward className="w-[0.95rem] h-[0.95rem] md:w-5 md:h-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`rounded-full w-[1.875rem] h-[1.875rem] md:w-10 md:h-10 hover:bg-white/10 ${
                  repeatMode === 'off' ? 'text-muted-foreground' : 'text-cyan-300'
                }`}
                data-testid="player-repeat-button"
                aria-label={
                  repeatMode === 'one'
                    ? 'Répéter le titre'
                    : repeatMode === 'all'
                      ? 'Répéter la file'
                      : 'Répétition désactivée'
                }
                onClick={cycleRepeat}
              >
                {repeatMode === 'one' ? (
                  <Repeat1 className="w-[0.95rem] h-[0.95rem] md:w-5 md:h-5" />
                ) : (
                  <Repeat className="w-[0.95rem] h-[0.95rem] md:w-5 md:h-5" />
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`relative rounded-full w-[1.875rem] h-[1.875rem] md:w-10 md:h-10 hover:bg-white/10 ${
                  queueOpen ? 'text-cyan-300' : 'text-muted-foreground'
                }`}
                data-testid="player-queue-button"
                aria-label="File d’attente"
                aria-expanded={queueOpen}
                onClick={() => setQueueOpen((open) => !open)}
              >
                <ListMusic className="w-[0.95rem] h-[0.95rem] md:w-5 md:h-5" />
                {queue.length > 1 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[1rem] h-4 px-1 rounded-full bg-cyan-500 text-[9px] font-bold text-black leading-4 text-center">
                    {queue.length}
                  </span>
                )}
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

          {/* Mobile time labels intentionally hidden for compact player */}
        </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default AudioPlayer;
