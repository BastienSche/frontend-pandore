import React from 'react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { Play, Pause, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const TrackCard = ({ track }) => {
  const { currentTrack, isPlaying, playTrack } = useAudioPlayer();
  const navigate = useNavigate();
  const isCurrentTrack = currentTrack?.track_id === track.track_id;

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
          {track.cover_url ? (
            <img
              src={track.cover_url}
              alt={track.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <Play className="w-16 h-16 text-white/30" />
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
          
          {/* Glow effect on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 to-transparent" />
          </div>
          
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
                playTrack(track);
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
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className="text-xs bg-white/5 border border-white/10 text-muted-foreground"
              >
                {track.genre}
              </Badge>
              <span 
                className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400"
                data-testid={`track-price-${track.track_id}`}
              >
                {(track.price / 100).toFixed(2)}€
              </span>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full w-8 h-8 hover:bg-pink-500/10 hover:text-pink-400 transition-colors"
              data-testid={`track-like-button-${track.track_id}`}
            >
              <Heart className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TrackCard;
