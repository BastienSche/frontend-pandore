import React, { useEffect } from 'react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  return (
    <div className="fixed bottom-0 left-0 right-0 h-24 glass border-t border-border/50 z-50 flex items-center px-8 justify-between" data-testid="audio-player">
      <div className="flex items-center gap-4 flex-1">
        {currentTrack.cover_url && (
          <img
            src={currentTrack.cover_url}
            alt={currentTrack.title}
            className="w-14 h-14 rounded-xl object-cover"
          />
        )}
        <div>
          <h4 className="font-medium text-sm" data-testid="player-track-title">{currentTrack.title}</h4>
          <p className="text-xs text-muted-foreground" data-testid="player-artist-name">{currentTrack.artist_name}</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 flex-1">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" data-testid="player-previous-button">
            <SkipBack className="w-5 h-5" />
          </Button>
          
          <Button
            variant="default"
            size="icon"
            className="rounded-full w-12 h-12 bg-primary hover:bg-primary/90"
            onClick={() => isPlaying ? pause() : playTrack(currentTrack)}
            data-testid="player-play-pause-button"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </Button>
          
          <Button variant="ghost" size="icon" className="rounded-full" data-testid="player-next-button">
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full max-w-md">
          <span className="text-xs text-muted-foreground w-10 text-right">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1"
            data-testid="player-progress-bar"
          />
          <span className="text-xs text-muted-foreground w-10">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex-1" />
    </div>
  );
};

export default AudioPlayer;