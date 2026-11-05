import React, { useEffect, useState } from 'react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { Play, Pause, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { fetchLikeState, like, unlike } from '@/lib/likes';
import { formatItemPriceLabel } from '@/lib/pricing';
import { splitGenreTags } from '@/lib/genreTags';
import { heartIconActiveClass } from '@/lib/heartIconClass';
import { goToLogin } from '@/lib/postLoginRedirect';
import { useAuth } from '@/hooks/useAuth';
import CoverImage from '@/components/CoverImage';

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
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isCurrentTrack = currentTrack?.track_id === track.track_id;
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      setLiked(false);
      return undefined;
    }
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
  }, [authLoading, isAuthenticated, track.track_id]);

  const toggleLike = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info('Connecte-toi pour ajouter aux favoris.');
      goToLogin(navigate, location.pathname);
      return;
    }
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
          <div className="absolute top-3 left-3 z-20 flex flex-col items-start gap-1.5 max-w-[70%]">
            {mixLabel(track.mix_version) && (
              <div className="px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-sm border border-white/15 text-[11px] font-semibold text-white">
                {mixLabel(track.mix_version)}
              </div>
            )}
            {splitGenreTags(track.genre).slice(0, 2).map((g, i) => (
              <div
                key={`${track.track_id}-cover-genre-${i}`}
                className="px-3 py-1 rounded-full bg-black/55 backdrop-blur-sm border border-white/15 text-[11px] font-semibold text-white/95 max-w-full truncate"
                title={g}
              >
                {g}
              </div>
            ))}
          </div>

          <CoverImage
            src={track.cover_url}
            alt={track.title}
            className="w-full h-full"
            imgClassName="transition-transform duration-700 group-hover:scale-110"
          />

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
            className="absolute bottom-4 right-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300"
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
            <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-cyan-500/30">
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
          
          <div className="flex items-center justify-between gap-2">
            <span
              className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400"
              data-testid={`track-price-${track.track_id}`}
            >
              {formatItemPriceLabel(track)}
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
    </motion.div>
  );
};

export default TrackCard;
