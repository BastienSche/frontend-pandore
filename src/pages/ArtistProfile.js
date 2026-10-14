import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Music, Disc, Heart, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import TrackCard from '@/components/TrackCard';
import AlbumCard from '@/components/AlbumCard';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { BubbleBackground, GlowOrb } from '@/components/BubbleCard';
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
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <BubbleBackground />
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <Loader2 className="w-12 h-12 text-cyan-400" />
        </motion.div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <BubbleBackground />
        <p className="relative z-10 text-muted-foreground">Artiste non trouvé</p>
      </div>
    );
  }

  const displayName = artist.artist_name || artist.name || 'Artiste';

  return (
    <div className="min-h-screen pb-32 relative overflow-hidden">
      <BubbleBackground />
      <GlowOrb color="cyan" size={560} x="12%" y="22%" blur={160} />
      <GlowOrb color="purple" size={480} x="88%" y="68%" blur={140} />

      <div className="relative pt-28 pb-10 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="glass-heavy rounded-[2.5rem] border border-white/10 p-6 md:p-8"
          >
            <div className="flex flex-col sm:flex-row gap-6 md:gap-8 items-start sm:items-center">
              <div className="relative shrink-0">
                <Avatar className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 border-2 border-white/15 shadow-2xl">
                  <AvatarImage src={artist.picture} className="object-cover" />
                  <AvatarFallback className="text-4xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
                    {displayName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-cyan-500/25 to-purple-500/25 blur-2xl -z-10" />
              </div>

              <div className="flex-1 min-w-0">
                <Badge className="rounded-full px-3 py-1 bg-white/5 border border-white/10 text-foreground/80 mb-3">
                  Artiste
                </Badge>
                <h1
                  className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight break-words"
                  data-testid="artist-name"
                >
                  {displayName}
                </h1>
                <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                  {artist.tracks?.length || 0} titres • {artist.albums?.length || 0} albums
                </p>
                {artist.bio && (
                  <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl line-clamp-4">
                    {artist.bio}
                  </p>
                )}
              </div>

              <Button
                size="lg"
                variant="outline"
                className="rounded-full w-full sm:w-auto shrink-0 border-white/15 hover:bg-white/5"
                data-testid="follow-artist-button"
                onClick={toggleFollow}
              >
                <Heart className={`w-5 h-5 mr-2 ${heartIconActiveClass(following)}`} />
                {following ? 'Suivi' : 'Suivre'}
              </Button>
            </div>
          </motion.div>

          <div className="mt-10">
            <Tabs defaultValue="tracks" className="w-full">
              <div className="mb-8 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <TabsList className="w-max min-w-full !h-auto items-center gap-1 glass-heavy border border-white/10 rounded-full p-1.5 overflow-hidden">
                  <TabsTrigger
                    value="tracks"
                    className="gap-2 rounded-full h-9 px-5 py-0 border border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:border-cyan-500/30 data-[state=active]:shadow-none"
                    data-testid="artist-tracks-tab"
                  >
                    <Music className="w-4 h-4" />
                    Titres ({artist.tracks?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger
                    value="albums"
                    className="gap-2 rounded-full h-9 px-5 py-0 border border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:border-purple-500/30 data-[state=active]:shadow-none"
                    data-testid="artist-albums-tab"
                  >
                    <Disc className="w-4 h-4" />
                    Albums ({artist.albums?.length || 0})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="tracks" data-testid="artist-tracks-grid">
                {artist.tracks && artist.tracks.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                    {artist.tracks.map((track) => (
                      <TrackCard key={track.track_id} track={track} />
                    ))}
                  </div>
                ) : (
                  <div className="glass-heavy rounded-[28px] border border-white/10 text-center py-14">
                    <Music className="w-14 h-14 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <p className="text-muted-foreground">Aucun titre disponible</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="albums" data-testid="artist-albums-grid">
                {artist.albums && artist.albums.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                    {artist.albums.map((album) => (
                      <AlbumCard key={album.album_id} album={album} />
                    ))}
                  </div>
                ) : (
                  <div className="glass-heavy rounded-[28px] border border-white/10 text-center py-14">
                    <Disc className="w-14 h-14 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <p className="text-muted-foreground">Aucun album disponible</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistProfile;
