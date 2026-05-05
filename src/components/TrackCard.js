import React, { useEffect, useState } from 'react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { Play, Pause, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchLikeState, like, unlike } from '@/lib/likes';
import { formatPriceLabel } from '@/lib/pricing';
import { splitGenreTags } from '@/lib/genreTags';
import { heartIconActiveClass } from '@/lib/heartIconClass';

const mixLabel = (v) => {
  const s = String(v || '').toLowerCase();
  if (s === 'maquette') return 'Maquette';
  if (s === 'mixed') return 'Mixed';
  return null;
};

const availabilityLabel = (v) => {
  const s = String(v || '').toLowerCase();
  if (s === 'exclusive') return 'Kloud Exclusive';
  if (s === 'all_platforms') return 'Toutes plateformes';
  return null;
};

const TrackCard = ({ track }) => {
  const { currentTrack, isPlaying, playTrack } = useAudioPlayer();
  const navigate = useNavigate();
  const isCurrentTrack = currentTrack?.track_id === track.track_id;
  const [liked, setLiked] = useState(false);
  const [coverError, setCoverError] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const state = await fetchLikeState('track', [track.track_id]);
        if (mounted) setLiked(!!state?.[track.track_id]);
      } catch {
        // ignore (unauthenticated or network)
      }
    })();
    return () => {
      mounted = false;
    };
  }, [track.track_id]);

  const toggleLike = async (e) => {
    e.stopPropagation();
    const next = !liked;
    setLiked(next);
    try {
      if (next) await like('track', track.track_id);
      else await unlike('track', track.track_id);
    } catch {
      setLiked(!next);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group relative"
      data-testid={`track-card-${track.track_id}`}
    >
      <div className="relative overflow-hidden rounded-3xl bubble-card">
        {/* Cover Image */}
        <div 
          className="relative aspect-square cursor-pointer" 
          onClick={() => navigate(`/track/${track.track_id}`)}
        >
          {/* Overlays (no layout impact) */}
          {mixLabel(track.mix_version) && (
            <div className="absolute top-3 left-3 z-20">
              <div className="px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-sm border border-white/15 text-[11px] font-semibold text-white">
                {mixLabel(track.mix_version)}
              </div>
            </div>
          )}

          {track.cover_url && !coverError ? (
            <img
              src={track.cover_url}
              alt={track.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
              onError={() => setCoverError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <Play className="w-16 h-16 text-white/30" />
            </div>
          )}

          {availabilityLabel(track.availability) && (
            <div className="absolute bottom-0 inset-x-0 z-10">
              <div className="px-4 py-2 bg-gradient-to-r from-black/70 via-black/35 to-black/70 backdrop-blur-sm border-t border-white/10">
                <div className="text-[11px] font-semibold tracking-wide text-white/90">
                  {availabilityLabel(track.availability)}
                </div>
              </div>
            </div>
          )}

          {/* Play Button */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1 }}
            className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <Button
              variant="default"
              size="icon"
              className="rounded-full w-12 h-12 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 border-0 shadow-[0_0_20px_rgba(34,211,238,0.4)]"
              onClick={(e) => {
                e.stopPropagation();
                playTrack(track, { mode: 'preview' });
              }}
              data-testid={`track-play-button-${track.track_id}`}
            >
              {isCurrentTrack && isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white ml-0.5" />
              )}
            </Button>
          </motion.div>

          {/* Now Playing Indicator */}
          {isCurrentTrack && isPlaying && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-cyan-500/30">
              <div className="flex gap-0.5">
                <span className="w-1 h-3 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-4 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-cyan-400 font-medium">En lecture</span>
            </div>
          )}
        </div>

        {/* Track Info */}
        <div className="p-4 space-y-3">
          <div>
            <h3 
              className="font-semibold text-base truncate group-hover:text-cyan-400 transition-colors cursor-pointer" 
              onClick={() => navigate(`/track/${track.track_id}`)}
              data-testid={`track-title-${track.track_id}`}
            >
              {track.title}
            </h3>
            <p 
              className="text-sm text-muted-foreground truncate"
              data-testid={`track-artist-${track.track_id}`}
            >
              {track.artist_name}
            </p>
          </div>
          
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {splitGenreTags(track.genre).map((g, i) => (
                  <Badge
                    key={`${track.track_id}-genre-${i}`}
                    variant="secondary"
                    className="shrink-0 whitespace-nowrap text-xs leading-tight bg-white/5 border border-white/10 text-muted-foreground max-w-[11rem] truncate"
                    title={g}
                  >
                    {g}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400"
                data-testid={`track-price-${track.track_id}`}
              >
                {formatPriceLabel(track.price)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full w-8 h-8 hover:bg-pink-500/10 hover:text-pink-400 transition-colors"
                data-testid={`track-like-button-${track.track_id}`}
                onClick={toggleLike}
              >
                <Heart className={`w-4 h-4 ${heartIconActiveClass(liked)}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TrackCard;
