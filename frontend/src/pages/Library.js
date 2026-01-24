import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Download, Music, Disc, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TrackCard from '@/components/TrackCard';
import AlbumCard from '@/components/AlbumCard';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Library = () => {
  const [searchParams] = useSearchParams();
  const [library, setLibrary] = useState({ tracks: [], albums: [] });
  const [loading, setLoading] = useState(true);
  const [checkingPayment, setCheckingPayment] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      checkPaymentStatus(sessionId);
    } else {
      fetchLibrary();
    }
  }, [searchParams]);

  const checkPaymentStatus = async (sessionId) => {
    setCheckingPayment(true);
    let attempts = 0;
    const maxAttempts = 5;

    const poll = async () => {
      try {
        const response = await axios.get(`${API}/purchases/status/${sessionId}`, {
          withCredentials: true
        });

        if (response.data.payment_status === 'paid') {
          toast.success('✅ Paiement réussi ! Votre achat est disponible.');
          fetchLibrary();
          setCheckingPayment(false);
          // Clean URL
          window.history.replaceState({}, '', '/library');
          return;
        }

        if (response.data.status === 'expired') {
          toast.error('Session de paiement expirée');
          setCheckingPayment(false);
          fetchLibrary();
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          toast.error('Vérification du paiement expirée');
          setCheckingPayment(false);
          fetchLibrary();
        }
      } catch (error) {
        console.error('Payment check error:', error);
        setCheckingPayment(false);
        fetchLibrary();
      }
    };

    poll();
  };

  const fetchLibrary = async () => {
    try {
      const response = await axios.get(`${API}/purchases/library`, {
        withCredentials: true
      });
      setLibrary(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement de la bibliothèque');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileUrl, filename) => {
    try {
      const response = await axios.get(fileUrl, {
        responseType: 'blob',
        withCredentials: true
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Téléchargement commencé');
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  if (checkingPayment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" data-testid="payment-checking">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Vérification du paiement...</p>
        <p className="text-sm text-muted-foreground">Veuillez patienter</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <div className="bg-gradient-to-br from-primary/20 via-background to-background py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4" data-testid="library-title">
            Ma Bibliothèque
          </h1>
          <p className="text-lg text-muted-foreground">
            Tous vos achats en un seul endroit
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Chargement...</p>
          </div>
        ) : library.tracks.length === 0 && library.albums.length === 0 ? (
          <div className="text-center py-24" data-testid="empty-library">
            <Music className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">Votre bibliothèque est vide</h3>
            <p className="text-muted-foreground mb-6">Commencez à acheter de la musique pour remplir votre collection</p>
            <Button onClick={() => window.location.href = '/browse'} className="rounded-full" data-testid="browse-from-empty">
              Découvrir la musique
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="tracks" className="w-full">
            <TabsList className="mb-8">
              <TabsTrigger value="tracks" className="gap-2" data-testid="library-tracks-tab">
                <Music className="w-4 h-4" />
                Titres ({library.tracks.length})
              </TabsTrigger>
              <TabsTrigger value="albums" className="gap-2" data-testid="library-albums-tab">
                <Disc className="w-4 h-4" />
                Albums ({library.albums.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tracks" data-testid="library-tracks-grid">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {library.tracks.map(track => (
                  <div key={track.track_id} className="relative">
                    <TrackCard track={track} />
                    {track.file_url && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute top-2 right-2 rounded-full w-8 h-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(track.file_url, `${track.title}.mp3`);
                        }}
                        data-testid={`download-track-${track.track_id}`}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="albums" data-testid="library-albums-grid">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {library.albums.map(album => (
                  <div key={album.album_id} className="relative">
                    <AlbumCard album={album} />
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Library;