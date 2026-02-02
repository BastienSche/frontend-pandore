import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Music, Disc, Heart, ExternalLink, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import TrackCard from '@/components/TrackCard';
import AlbumCard from '@/components/AlbumCard';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ArtistProfile = () => {
  const { artistId } = useParams();
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchArtist();
  }, [artistId]);

  const fetchArtist = async () => {
    try {
      const response = await axios.get(`${API}/artists/${artistId}`);
      setArtist(response.data);
    } catch (error) {
      toast.error('Artiste introuvable');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Artiste non trouvé</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <div className="relative h-80 bg-gradient-to-b from-primary/30 to-background">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        
        <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex items-end pb-8">
          <div className="flex items-end gap-6">
            <Avatar className="w-40 h-40 border-4 border-background shadow-2xl">
              <AvatarImage src={artist.picture} />
              <AvatarFallback className="text-4xl">{artist.name?.[0] || artist.artist_name?.[0]}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 pb-2">
              <p className="text-sm text-muted-foreground mb-2">ARTISTE</p>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4" data-testid="artist-name">
                {artist.artist_name || artist.name}
              </h1>
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">
                  {artist.tracks?.length || 0} titres • {artist.albums?.length || 0} albums
                </span>
              </div>
            </div>

            <Button size="lg" variant="outline" className="rounded-full" data-testid="follow-artist-button">
              <Heart className="w-5 h-5 mr-2" />
              Suivre
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {artist.bio && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">À propos</h2>
            <p className="text-muted-foreground leading-relaxed max-w-3xl">{artist.bio}</p>
          </div>
        )}

        <Tabs defaultValue="tracks" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="tracks" className="gap-2" data-testid="artist-tracks-tab">
              <Music className="w-4 h-4" />
              Titres ({artist.tracks?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="albums" className="gap-2" data-testid="artist-albums-tab">
              <Disc className="w-4 h-4" />
              Albums ({artist.albums?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tracks" data-testid="artist-tracks-grid">
            {artist.tracks && artist.tracks.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {artist.tracks.map(track => (
                  <TrackCard key={track.track_id} track={track} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Music className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucun titre disponible</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="albums" data-testid="artist-albums-grid">
            {artist.albums && artist.albums.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {artist.albums.map(album => (
                  <AlbumCard key={album.album_id} album={album} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Disc className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucun album disponible</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ArtistProfile;