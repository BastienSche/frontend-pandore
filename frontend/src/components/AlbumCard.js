import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const AlbumCard = ({ album }) => {
  const navigate = useNavigate();

  return (
    <Card
      className="group relative overflow-hidden rounded-2xl bg-muted transition-all hover:shadow-2xl hover:shadow-primary/10 cursor-pointer"
      onClick={() => navigate(`/album/${album.album_id}`)}
      data-testid={`album-card-${album.album_id}`}
    >
      <CardContent className="p-0">
        <div className="relative aspect-square">
          {album.cover_url ? (
            <img
              src={album.cover_url}
              alt={album.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-accent/20 to-background flex items-center justify-center">
              <Music className="w-16 h-16 text-accent/40" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <Badge className="absolute top-4 left-4" data-testid={`album-tracks-count-${album.album_id}`}>
            {album.track_ids.length} titres
          </Badge>
        </div>

        <div className="p-4">
          <h3 className="font-medium text-base truncate" data-testid={`album-title-${album.album_id}`}>{album.title}</h3>
          <p className="text-sm text-muted-foreground truncate" data-testid={`album-artist-${album.album_id}`}>{album.artist_name}</p>
          
          <div className="flex items-center justify-between mt-3">
            <span className="text-lg font-bold text-primary" data-testid={`album-price-${album.album_id}`}>${album.price}</span>
            
            <Button variant="ghost" size="icon" className="rounded-full w-8 h-8" data-testid={`album-like-button-${album.album_id}`}>
              <Heart className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlbumCard;