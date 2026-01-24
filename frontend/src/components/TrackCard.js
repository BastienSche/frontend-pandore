import React from 'react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { Play, Pause, Heart, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

const TrackCard = ({ track }) => {
  const { currentTrack, isPlaying, playTrack } = useAudioPlayer();
  const navigate = useNavigate();
  const isCurrentTrack = currentTrack?.track_id === track.track_id;

  return (
    <Card
      className="group relative overflow-hidden rounded-2xl bg-muted transition-all hover:shadow-2xl hover:shadow-primary/10 cursor-pointer"
      data-testid={`track-card-${track.track_id}`}
    >
      <CardContent className="p-0">
        <div className="relative aspect-square" onClick={() => navigate(`/track/${track.track_id}`)}>
          {track.cover_url ? (
            <img
              src={track.cover_url}
              alt={track.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-background flex items-center justify-center">
              <Play className="w-16 h-16 text-primary/40" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <Button
            variant="default"
            size="icon"
            className="absolute bottom-4 right-4 rounded-full w-12 h-12 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              playTrack(track);
            }}
            data-testid={`track-play-button-${track.track_id}`}
          >
            {isCurrentTrack && isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
        </div>

        <div className="p-4">
          <h3 className="font-medium text-base truncate" data-testid={`track-title-${track.track_id}`}>{track.title}</h3>
          <p className="text-sm text-muted-foreground truncate" data-testid={`track-artist-${track.track_id}`}>{track.artist_name}</p>
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">{track.genre}</Badge>
              <span className="text-lg font-bold text-primary" data-testid={`track-price-${track.track_id}`}>${track.price}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="rounded-full w-8 h-8" data-testid={`track-like-button-${track.track_id}`}>
                <Heart className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrackCard;