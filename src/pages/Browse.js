import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, Disc, Music } from 'lucide-react';
import TrackCard from '@/components/TrackCard';
import AlbumCard from '@/components/AlbumCard';
import { BubbleBackground, GlowOrb } from '@/components/BubbleCard';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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

const Browse = () => {
  const [tracks, setTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tracksRes, albumsRes] = await Promise.all([
        axios.get(`${API}/tracks`),
        axios.get(`${API}/albums`)
      ]);
      setTracks(tracksRes.data);
      setAlbums(albumsRes.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const filteredTracks = tracks.filter(track =>
    track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAlbums = albums.filter(album =>
    album.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    album.artist_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-32 relative overflow-hidden">
      {/* Background Effects */}
      <BubbleBackground />
      <GlowOrb color="cyan" size={500} x="10%" y="20%" blur={120} />
      <GlowOrb color="purple" size={400} x="90%" y="60%" blur={100} />

      {/* Hero Header */}
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
          
          {/* Search Input */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative max-w-2xl"
          >
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher des titres, albums ou artistes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-14 h-16 rounded-full text-base glass-heavy border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 placeholder:text-muted-foreground/50"
              data-testid="browse-search-input"
            />
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 relative z-10">
        <Tabs defaultValue="tracks" className="w-full">
          <TabsList 
            className="mb-10 bg-white/5 border border-white/10 rounded-full p-1.5" 
            data-testid="browse-tabs"
          >
            <TabsTrigger 
              value="tracks" 
              className="gap-2 rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:border data-[state=active]:border-cyan-500/30 px-6 py-2.5"
              data-testid="tracks-tab"
            >
              <Music className="w-4 h-4" />
              Titres ({filteredTracks.length})
            </TabsTrigger>
            <TabsTrigger 
              value="albums" 
              className="gap-2 rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:border data-[state=active]:border-purple-500/30 px-6 py-2.5"
              data-testid="albums-tab"
            >
              <Disc className="w-4 h-4" />
              Albums ({filteredAlbums.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tracks" data-testid="tracks-grid">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="aspect-square rounded-3xl glass animate-pulse" />
                ))}
              </div>
            ) : filteredTracks.length > 0 ? (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6"
              >
                {filteredTracks.map((track, index) => (
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
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="aspect-square rounded-3xl glass animate-pulse" />
                ))}
              </div>
            ) : filteredAlbums.length > 0 ? (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6"
              >
                {filteredAlbums.map((album, index) => (
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
        </Tabs>
      </div>
    </div>
  );
};

export default Browse;
