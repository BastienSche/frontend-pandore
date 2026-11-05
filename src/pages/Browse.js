import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, Disc, Music, User } from 'lucide-react';
import TrackCard from '@/components/TrackCard';
import AlbumCard from '@/components/AlbumCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BubbleBackground, GlowOrb } from '@/components/BubbleCard';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { apiClient, formatApiError, resolveApiUrl, normalizeApiList } from '@/lib/apiClient';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 }
  }
};

const isPublicItem = (item) => {
  const status = String(item?.status || 'published').toLowerCase();
  return status === 'published' || status === 'public';
};

const mapTrack = (t) => ({
  ...t,
  preview_url: resolveApiUrl(t?.preview_url),
  file_url: null,
  cover_url: resolveApiUrl(t?.cover_url)
});

const mapAlbum = (a) => ({
  ...a,
  cover_url: resolveApiUrl(a?.cover_url)
});

const Browse = () => {
  const [catalog, setCatalog] = useState({ tracks: [], albums: [], artists: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [tracksResp, albumsResp, artistsResp] = await Promise.all([
          apiClient.get('/api/tracks'),
          apiClient.get('/api/albums'),
          apiClient.get('/api/artists')
        ]);
        if (cancelled) return;
        setCatalog({
          tracks: normalizeApiList(tracksResp.data).filter(isPublicItem).map(mapTrack),
          albums: normalizeApiList(albumsResp.data).filter(isPublicItem).map(mapAlbum),
          artists: normalizeApiList(artistsResp.data)
        });
      } catch (error) {
        if (!cancelled) toast.error(formatApiError(error, 'Erreur lors du chargement'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults(null);
      setSearching(false);
      return undefined;
    }

    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await apiClient.get('/api/search', {
          params: { q, types: 'tracks,albums,artists', limit: 40 }
        });
        if (cancelled) return;
        setSearchResults({
          tracks: normalizeApiList(data?.tracks).filter(isPublicItem).map(mapTrack),
          albums: normalizeApiList(data?.albums).filter(isPublicItem).map(mapAlbum),
          artists: normalizeApiList(data?.artists)
        });
      } catch (error) {
        if (!cancelled) {
          setSearchResults({ tracks: [], albums: [], artists: [] });
          toast.error(formatApiError(error, 'Recherche impossible'));
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const tracks = searchResults ? searchResults.tracks : catalog.tracks;
  const albums = searchResults ? searchResults.albums : catalog.albums;
  const artists = searchResults ? searchResults.artists : catalog.artists;
  const busy = loading || (Boolean(searchQuery.trim()) && searching && !searchResults);

  return (
    <div className="min-h-screen pb-32 relative overflow-hidden">
      <BubbleBackground />
      <GlowOrb color="cyan" size={500} x="10%" y="20%" blur={120} />
      <GlowOrb color="purple" size={400} x="90%" y="60%" blur={100} />

      <div className="relative pt-28 pb-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1
              className="text-5xl md:text-7xl font-bold tracking-tighter mb-4"
              data-testid="browse-title"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                Découvrir
              </span>
            </h1>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl">
              Explorez les dernières sorties et trouvez votre prochaine musique préférée
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative max-w-2xl"
          >
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher des titres, albums, artistes ou genres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-14 h-16 rounded-full text-base glass-heavy border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 placeholder:text-muted-foreground/50"
              data-testid="browse-search-input"
            />
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 relative z-10">
        <Tabs defaultValue="tracks" className="w-full">
          <TabsList
            className="mb-10 !h-auto items-center bg-white/5 border border-white/10 rounded-full p-1.5 overflow-hidden"
            data-testid="browse-tabs"
          >
            <TabsTrigger
              value="tracks"
              className="gap-2 rounded-full h-9 px-6 py-0 border border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:border-cyan-500/30 data-[state=active]:shadow-none"
              data-testid="tracks-tab"
            >
              <Music className="w-4 h-4" />
              Titres ({tracks.length})
            </TabsTrigger>
            <TabsTrigger
              value="albums"
              className="gap-2 rounded-full h-9 px-6 py-0 border border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:border-purple-500/30 data-[state=active]:shadow-none"
              data-testid="albums-tab"
            >
              <Disc className="w-4 h-4" />
              Albums ({albums.length})
            </TabsTrigger>
            <TabsTrigger
              value="artists"
              className="gap-2 rounded-full h-9 px-6 py-0 border border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-cyan-500/20 data-[state=active]:border-emerald-500/30 data-[state=active]:shadow-none"
              data-testid="artists-tab"
            >
              <User className="w-4 h-4" />
              Artistes ({artists.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tracks" data-testid="tracks-grid">
            {busy ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="aspect-square rounded-3xl glass animate-pulse" />
                ))}
              </div>
            ) : tracks.length > 0 ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6"
              >
                {tracks.map((track) => (
                  <motion.div key={track.track_id} variants={itemVariants}>
                    <TrackCard track={track} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 glass-heavy rounded-3xl"
              >
                <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-lg text-muted-foreground">Aucun titre trouvé</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Essayez une autre recherche</p>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="albums" data-testid="albums-grid">
            {busy ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="aspect-square rounded-3xl glass animate-pulse" />
                ))}
              </div>
            ) : albums.length > 0 ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6"
              >
                {albums.map((album) => (
                  <motion.div key={album.album_id} variants={itemVariants}>
                    <AlbumCard album={album} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 glass-heavy rounded-3xl"
              >
                <Disc className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-lg text-muted-foreground">Aucun album trouvé</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Essayez une autre recherche</p>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="artists" data-testid="artists-grid">
            {busy ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="mx-auto w-40 h-40 rounded-full glass animate-pulse" />
                ))}
              </div>
            ) : artists.length > 0 ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 md:grid-cols-4 gap-8"
              >
                {artists.map((artist) => (
                  <motion.div key={artist.user_id} variants={itemVariants}>
                    <Link to={`/artist/${artist.user_id}`}>
                      <div className="group relative text-center">
                        <div className="relative mx-auto w-36 h-36 md:w-40 md:h-40">
                          <Avatar className="w-full h-full border-2 border-white/10 group-hover:border-cyan-400/50 transition-colors duration-300 shadow-2xl">
                            <AvatarImage src={artist.picture || artist.avatar_url} className="object-cover" />
                            <AvatarFallback className="text-3xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
                              {artist.artist_name?.[0] || artist.name?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="mt-4 space-y-1">
                          <h3 className="font-semibold text-lg group-hover:text-cyan-400 transition-colors truncate">
                            {artist.artist_name || artist.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">Artiste</p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 glass-heavy rounded-3xl"
              >
                <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-lg text-muted-foreground">Aucun artiste trouvé</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Essayez une autre recherche</p>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Browse;
