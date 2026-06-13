import React, { useState } from 'react';
import { Play, Pause, Download, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { formatTrackDuration } from '@/lib/libraryCollection';

const LibraryTrackRow = ({
  track,
  isCurrent,
  isPlaying,
  onPlay,
  onDownload,
  index
}) => {
  const navigate = useNavigate();
  const [coverError, setCoverError] = useState(false);
  const hasFile = Boolean(track.file_url || track.preview_url);

  return (
    <div
      className={`group flex items-center gap-3 md:gap-4 rounded-2xl border px-3 py-2.5 md:px-4 transition-colors ${
        isCurrent && isPlaying
          ? 'border-cyan-500/40 bg-cyan-500/5'
          : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
      }`}
      data-testid={`library-track-row-${track.track_id}`}
    >
      <span className="w-6 text-center text-xs text-muted-foreground font-mono tabular-nums shrink-0">
        {index + 1}
      </span>

      <div className="relative h-12 w-12 md:h-14 md:w-14 shrink-0 rounded-xl overflow-hidden bg-white/5">
        {track.cover_url && !coverError ? (
          <img
            src={track.cover_url}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setCoverError(true)}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Music className="w-6 h-6 text-white/25" />
          </div>
        )}
      </div>

      <button
        type="button"
        className="min-w-0 flex-1 text-left"
        onClick={() => navigate(`/library/tracks/${track.track_id}`)}
      >
        <p className="font-medium truncate text-sm md:text-base group-hover:text-cyan-300 transition-colors">
          {track.title}
        </p>
        <p className="text-xs md:text-sm text-muted-foreground truncate">{track.artist_name}</p>
      </button>

      <span className="hidden sm:block text-xs text-muted-foreground font-mono tabular-nums w-12 text-right shrink-0">
        {formatTrackDuration(track.duration)}
      </span>

      <div className="flex items-center gap-1 shrink-0">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={!hasFile}
          className="rounded-full h-10 w-10 md:h-11 md:w-11 hover:bg-cyan-500/15"
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          data-testid={`library-row-play-${track.track_id}`}
          aria-label={isCurrent && isPlaying ? 'Pause' : 'Lecture'}
        >
          {isCurrent && isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={!hasFile}
          className="rounded-full h-10 w-10 md:h-11 md:w-11 hover:bg-white/10 text-muted-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          data-testid={`library-row-download-${track.track_id}`}
          aria-label="Télécharger"
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default LibraryTrackRow;
