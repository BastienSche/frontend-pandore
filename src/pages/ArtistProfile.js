import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Music, Disc, Heart, ExternalLink, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import TrackCard from '@/components/TrackCard';
import AlbumCard from '@/components/AlbumCard';
import { toast } from 'sonner';
import { apiClient, resolveApiUrl } from '@/lib/apiClient';
import { fetchFollowState, followArtist, unfollowArtist } from '@/lib/follows';
import { heartIconActiveClass } from '@/lib/heartIconClass';

const ArtistProfile = () => {
  const { artistId } = useParams();
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiClient.get(`/api/artists/${artistId}`);
        const tracks = (data?.tracks || []).map((t) => ({
          ...t,
          preview_url: resolveApiUrl(t?.preview_url),
          file_url: resolveApiUrl(t?.file_url),
          cover_url: resolveApiUrl(t?.cover_url)
        }));
        const albums = (data?.albums || []).map((a) => ({
          ...a,
          cover_url: resolveApiUrl(a?.cover_url)
        }));
        setArtist({
          ...data,
          picture: resolveApiUrl(data?.picture),
          tracks,
          albums
        });
      } catch (error) {
        toast.error('Artiste introuvable');
        setArtist(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [artistId]);

  useEffect(() => {
    if (!artistId) return;
    let mounted = true;
    (async () => {
      try {
        const state = await fetchFollowState([artistId]);
        if (mounted) setFollowing(!!state?.[artistId]);
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, [artistId]);

  const toggleFollow = async () => {
    const next = !following;
    setFollowing(next);
    try {
      if (next) await followArtist(artistId);
      else await unfollowArtist(artistId);
    } catch (e) {
      setFollowing(!next);
      toast.error(e.response?.data?.detail || 'Erreur');
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
      <div className="relative min-h-[22rem] bg-gradient-to-b from-primary/30 to-background">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        
        <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex items-end pb-8">
          <div className="flex w-full flex-col items-start gap-5 sm:flex-row sm:items-end sm:gap-6">
            <Avatar className="w-28 h-28 sm:w-40 sm:h-40 border-4 border-background shadow-2xl shrink-0">
              <AvatarImage src={artist.picture} />
              <AvatarFallback className="text-4xl">{artist.name?.[0] || artist.artist_name?.[0]}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 pb-1 min-w-0">
              <p className="text-sm text-muted-foreground mb-2">ARTISTE</p>
              <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-3 break-words" data-testid="artist-name">
                {artist.artist_name || artist.name}
              </h1>
              <div className="flex items-center gap-4">
                <span className="text-sm sm:text-base text-muted-foreground">
                  {artist.tracks?.length || 0} titres • {artist.albums?.length || 0} albums
                </span>
              </div>
            </div>

            <Button
              size="lg"
              variant="outline"
              className="rounded-full w-full sm:w-auto"
              data-testid="follow-artist-button"
              onClick={toggleFollow}
            >
              <Heart className={`w-5 h-5 mr-2 ${heartIconActiveClass(following)}`} />
              {following ? 'Suivi' : 'Suivre'}
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
          <div className="mb-8 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsList className="w-max min-w-full">
            <TabsTrigger value="tracks" className="gap-2" data-testid="artist-tracks-tab">
              <Music className="w-4 h-4" />
              Titres ({artist.tracks?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="albums" className="gap-2" data-testid="artist-albums-tab">
              <Disc className="w-4 h-4" />
              Albums ({artist.albums?.length || 0})
            </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="tracks" data-testid="artist-tracks-grid">
            {artist.tracks && artist.tracks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
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