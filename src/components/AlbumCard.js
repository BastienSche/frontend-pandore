import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Heart, Disc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const AlbumCard = ({ album }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group relative"
      data-testid={`album-card-${album.album_id}`}
    >
      <div className="relative overflow-hidden rounded-3xl bubble-card">
        {/* Cover Image */}
        <div 
          className="relative aspect-square cursor-pointer" 
          onClick={() => navigate(`/album/${album.album_id}`)}
        >
          {album.cover_url ? (
            <img
              src={album.cover_url}
              alt={album.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-500/20 flex items-center justify-center">
              <Disc className="w-16 h-16 text-white/30" />
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
          
          {/* Glow effect on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent" />
          </div>
          
          {/* Track Count Badge */}
          <Badge 
            className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm border border-white/20 text-white"
            data-testid={`album-tracks-count-${album.album_id}`}
          >
            <Disc className="w-3 h-3 mr-1.5" />
            {album.track_ids?.length || 0} titres
          </Badge>
        </div>

        {/* Album Info */}
        <div className="p-4 space-y-3">
          <div>
            <h3 
              className="font-semibold text-base truncate group-hover:text-purple-400 transition-colors cursor-pointer" 
              onClick={() => navigate(`/album/${album.album_id}`)}
              data-testid={`album-title-${album.album_id}`}
            >
              {album.title}
            </h3>
            <p 
              className="text-sm text-muted-foreground truncate"
              data-testid={`album-artist-${album.album_id}`}
            >
              {album.artist_name}
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <span 
              className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"
              data-testid={`album-price-${album.album_id}`}
            >
              {(album.price / 100).toFixed(2)}€
            </span>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full w-8 h-8 hover:bg-pink-500/10 hover:text-pink-400 transition-colors"
              data-testid={`album-like-button-${album.album_id}`}
            >
              <Heart className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AlbumCard;
