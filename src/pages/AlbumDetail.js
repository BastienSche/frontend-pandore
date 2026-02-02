import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Heart, ShoppingCart, Music, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { toast } from 'sonner';
import TrackCard from '@/components/TrackCard';
import { addToLibrary, getAlbumById, getTracksByIds } from '@/data/fakeData';

const AlbumDetail = () => {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const { playTrack } = useAudioPlayer();
  const [album, setAlbum] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    const found = getAlbumById(albumId);
    if (!found) {
      toast.error('Album introuvable');
      navigate('/browse');
      return;
    }
    setAlbum(found);
    setTracks(found.track_ids?.length ? getTracksByIds(found.track_ids) : []);
    setLoading(false);
  }, [albumId, navigate]);

  const handlePurchase = async () => {
    setPurchasing(true);
    addToLibrary('album', albumId);
    toast.success('Album ajouté à votre bibliothèque');
    setPurchasing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!album) return null;

  const priceDisplay = (album.price / 100).toFixed(2);
  const totalDuration = tracks.reduce((sum, track) => sum + (track.duration || 0), 0);
  const hours = Math.floor(totalDuration / 3600);
  const minutes = Math.floor((totalDuration % 3600) / 60);

  return (
    <div className="min-h-screen pb-32">
      <div className="relative h-96 bg-gradient-to-b from-primary/30 to-background">
        {album.cover_url ? (
          <img
            src={album.cover_url}
            alt={album.title}
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Music className="w-32 h-32 text-primary/20" />
          </div>
        )}
        
        <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex items-end pb-8">
          <div className="flex items-end gap-6">
            {album.cover_url ? (
              <img
                src={album.cover_url}
                alt={album.title}
                className="w-48 h-48 rounded-2xl shadow-2xl"
                data-testid="album-cover-large"
              />
            ) : (
              <div className="w-48 h-48 rounded-2xl bg-muted flex items-center justify-center">
                <Music className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
            
            <div className="flex-1">
              <Badge className="mb-2">ALBUM</Badge>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4" data-testid="album-title">
                {album.title}
              </h1>
              <div className="flex items-center gap-4 text-lg">
                <span
                  className="hover:underline cursor-pointer font-medium"
                  onClick={() => navigate(`/artist/${album.artist_id}`)}
                  data-testid="album-artist-link"
                >
                  {album.artist_name}
                </span>
                <span>•</span>
                <span>{tracks.length} titres</span>
                {totalDuration > 0 && (
                  <>
                    <span>•</span>
                    <span>{hours > 0 ? `${hours}h ` : ''}{minutes}min</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {album.description && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-medium mb-2">À propos de l'album</h3>
                  <p className="text-muted-foreground">{album.description}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium mb-4">Titres</h3>
                <div className="space-y-2">
                  {tracks.map((track, index) => (
                    <div
                      key={track.track_id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                      onClick={() => playTrack(track)}
                      data-testid={`album-track-${index}`}
                    >
                      <span className="text-sm text-muted-foreground w-8">{index + 1}</span>
                      <Play className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex-1">
                        <p className="font-medium">{track.title}</p>
                        <p className="text-sm text-muted-foreground">{track.genre}</p>
                      </div>
                      {track.duration && (
                        <span className="text-sm text-muted-foreground">
                          {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Prix de l'album</p>
                  <p className="text-4xl font-bold" data-testid="album-price">{priceDisplay}€</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((album.price / 100) / tracks.length).toFixed(2)}€ par titre
                  </p>
                </div>

                <Button
                  className="w-full h-12 rounded-full"
                  onClick={handlePurchase}
                  disabled={purchasing}
                  data-testid="purchase-album-button"
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Acheter l'album
                    </>
                  )}
                </Button>

                <Button variant="outline" className="w-full h-12 rounded-full">
                  <Heart className="w-5 h-5 mr-2" />
                  Ajouter aux favoris
                </Button>

                <Separator />

                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>✓ {tracks.length} titres inclus</p>
                  <p>✓ Téléchargement illimité</p>
                  <p>✓ Qualité audio haute définition</p>
                  <p>✓ Support direct à l'artiste</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlbumDetail;