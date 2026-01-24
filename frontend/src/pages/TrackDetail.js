import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Play, Pause, Heart, ShoppingCart, Download, Music, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TrackDetail = () => {
  const { trackId } = useParams();
  const navigate = useNavigate();
  const { currentTrack, isPlaying, playTrack } = useAudioPlayer();
  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchTrack();
  }, [trackId]);

  const fetchTrack = async () => {
    try {
      const response = await axios.get(`${API}/tracks/${trackId}`);
      setTrack(response.data);
    } catch (error) {
      toast.error('Track introuvable');
      navigate('/browse');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const originUrl = window.location.origin;
      const response = await axios.post(
        `${API}/purchases/checkout`,
        {
          item_type: 'track',
          item_id: trackId,
          origin_url: originUrl
        },
        { withCredentials: true }
      );
      window.location.href = response.data.url;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'achat');
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!track) return null;

  const isCurrentTrack = currentTrack?.track_id === track.track_id;
  const priceDisplay = (track.price / 100).toFixed(2);

  return (
    <div className="min-h-screen pb-32">
      <div className="relative h-96 bg-gradient-to-b from-primary/30 to-background">
        {track.cover_url ? (
          <img
            src={track.cover_url}
            alt={track.title}
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Music className="w-32 h-32 text-primary/20" />
          </div>
        )}
        
        <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex items-end pb-8">
          <div className="flex items-end gap-6">
            {track.cover_url ? (
              <img
                src={track.cover_url}
                alt={track.title}
                className="w-48 h-48 rounded-2xl shadow-2xl"
                data-testid="track-cover-large"
              />
            ) : (
              <div className="w-48 h-48 rounded-2xl bg-muted flex items-center justify-center">
                <Music className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
            
            <div className="flex-1">
              <Badge className="mb-2">TRACK</Badge>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4" data-testid="track-title">
                {track.title}
              </h1>
              <div className="flex items-center gap-4 text-lg">
                <span
                  className="hover:underline cursor-pointer"
                  onClick={() => navigate(`/artist/${track.artist_id}`)}
                  data-testid="track-artist-link"
                >
                  {track.artist_name}
                </span>
                <span>•</span>
                <Badge variant="secondary">{track.genre}</Badge>
                {track.duration && (
                  <>
                    <span>•</span>
                    <span>{Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}</span>
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
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <Button
                    size="lg"
                    className="rounded-full w-14 h-14"
                    onClick={() => playTrack(track)}
                    data-testid="track-play-button"
                  >
                    {isCurrentTrack && isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </Button>
                  <div>
                    <p className="text-sm text-muted-foreground">Preview 15 secondes</p>
                    <p className="text-xs text-muted-foreground">Commence à {track.preview_start_time}s</p>
                  </div>
                </div>

                {track.description && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <h3 className="font-medium mb-2">Description</h3>
                      <p className="text-muted-foreground">{track.description}</p>
                    </div>
                  </>
                )}

                {track.mastering && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <h3 className="font-medium mb-2">Mastering</h3>
                      <p className="text-sm text-muted-foreground">
                        <strong>Engineer:</strong> {track.mastering.engineer || 'N/A'}
                      </p>
                      {track.mastering.details && (
                        <p className="text-sm text-muted-foreground mt-1">{track.mastering.details}</p>
                      )}
                    </div>
                  </>
                )}

                {track.splits && track.splits.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <h3 className="font-medium mb-2">Répartition</h3>
                      <div className="space-y-2">
                        {track.splits.map((split, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{split.party}</span>
                            <span className="font-medium">{split.percent}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Prix</p>
                  <p className="text-4xl font-bold" data-testid="track-price">{priceDisplay}€</p>
                </div>

                <Button
                  className="w-full h-12 rounded-full"
                  onClick={handlePurchase}
                  disabled={purchasing}
                  data-testid="purchase-button"
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Acheter
                    </>
                  )}
                </Button>

                <Button variant="outline" className="w-full h-12 rounded-full" data-testid="like-button">
                  <Heart className="w-5 h-5 mr-2" />
                  Ajouter aux favoris
                </Button>

                <Separator />

                <div className="space-y-2 text-sm text-muted-foreground">
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

export default TrackDetail;