import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Music, Play, TrendingUp, Sparkles, ArrowRight, Disc, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import TrackCard from '@/components/TrackCard';
import AlbumCard from '@/components/AlbumCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const [newReleases, setNewReleases] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [featuredArtists, setFeaturedArtists] = useState([]);
  const [featuredAlbums, setFeaturedAlbums] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      const [tracksRes, albumsRes, artistsRes] = await Promise.all([
        axios.get(`${API}/tracks?limit=12`),
        axios.get(`${API}/albums?limit=8`),
        axios.get(`${API}/artists?limit=8`)
      ]);
      
      setNewReleases(tracksRes.data.slice(0, 6));
      setTopTracks(tracksRes.data.sort((a, b) => b.likes_count - a.likes_count).slice(0, 6));
      setFeaturedAlbums(albumsRes.data);
      setFeaturedArtists(artistsRes.data);
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4 bg-gradient-to-br from-primary/20 via-background to-background overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1714779573250-36242918e044?crop=entropy&cs=srgb&fm=jpg&q=85')] bg-cover bg-center opacity-10" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight" data-testid="hero-title">
              Possédez votre musique,
              <br />
              <span className="text-primary">pour toujours</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed" data-testid="hero-description">
              Pandore réinvente l'achat de musique numérique. Achetez, téléchargez et gardez vos titres préférés pour toujours. Sans abonnement, sans limites.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/register" data-testid="hero-register-link">
              <Button size="lg" className="rounded-full px-8 py-6 text-lg shadow-lg shadow-primary/25" data-testid="hero-register-button">
                <Play className="w-5 h-5 mr-2" />
                Commencer gratuitement
              </Button>
            </Link>
            
            <Link to="/browse" data-testid="hero-browse-link">
              <Button size="lg" variant="outline" className="rounded-full px-8 py-6 text-lg" data-testid="hero-browse-button">
                <Sparkles className="w-5 h-5 mr-2" />
                Découvrir la musique
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex justify-center gap-12 pt-8"
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">140+</div>
              <div className="text-sm text-muted-foreground">Titres</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">20+</div>
              <div className="text-sm text-muted-foreground">Artistes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">20+</div>
              <div className="text-sm text-muted-foreground">Albums</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* New Releases */}
      <section className="py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-2">
                Nouveautés
              </h2>
              <p className="text-muted-foreground">Les dernières sorties des artistes</p>
            </div>
            <Link to="/browse">
              <Button variant="ghost" className="rounded-full">
                Tout voir <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">Chargement...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {newReleases.map(track => (
                <TrackCard key={track.track_id} track={track} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Top Tracks */}
      <section className="py-24 px-4 md:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-2">
                <TrendingUp className="w-8 h-8 inline-block mr-3 text-primary" />
                Top du moment
              </h2>
              <p className="text-muted-foreground">Les tracks les plus aimés</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {topTracks.map((track, index) => (
              <div key={track.track_id} className="relative">
                <Badge className="absolute -top-2 -left-2 z-10 w-8 h-8 rounded-full flex items-center justify-center">
                  {index + 1}
                </Badge>
                <TrackCard track={track} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Albums */}
      <section className="py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-2">
                <Disc className="w-8 h-8 inline-block mr-3 text-primary" />
                Albums à découvrir
              </h2>
              <p className="text-muted-foreground">Collections complètes d'artistes talentueux</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {featuredAlbums.map(album => (
              <AlbumCard key={album.album_id} album={album} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Artists */}
      <section className="py-24 px-4 md:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-2">
                <Star className="w-8 h-8 inline-block mr-3 text-primary" />
                Artistes en vedette
              </h2>
              <p className="text-muted-foreground">Découvrez les talents de la plateforme</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featuredArtists.map(artist => (
              <Link key={artist.user_id} to={`/artist/${artist.user_id}`}>
                <Card className="group hover:shadow-lg transition-all cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <Avatar className="w-32 h-32 mx-auto mb-4">
                      <AvatarImage src={artist.picture} />
                      <AvatarFallback>{artist.artist_name?.[0] || artist.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-medium text-lg mb-1">{artist.artist_name || artist.name}</h3>
                    <p className="text-sm text-muted-foreground">Artiste</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Pandore Section */}
      <section className="py-24 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-4">
              Pourquoi Pandore ?
            </h2>
            <p className="text-lg text-muted-foreground">
              Une nouvelle approche de la musique numérique
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="p-8 rounded-2xl bg-muted hover:bg-muted/80 transition-all"
              data-testid="feature-ownership"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Music className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-medium mb-3">Vraie propriété</h3>
              <p className="text-muted-foreground">
                Achetez une fois, gardez pour toujours. Téléchargez vos titres et écoutez-les même hors ligne.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="p-8 rounded-2xl bg-muted hover:bg-muted/80 transition-all"
              data-testid="feature-artists"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-medium mb-3">Soutenez les artistes</h3>
              <p className="text-muted-foreground">
                Les artistes reçoivent une part équitable. Pas d'intermédiaires, juste vous et la musique.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="p-8 rounded-2xl bg-muted hover:bg-muted/80 transition-all"
              data-testid="feature-quality"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-medium mb-3">Haute qualité</h3>
              <p className="text-muted-foreground">
                Fichiers audio haute qualité, sans compression. La musique comme l'artiste l'a voulue.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 md:px-8 bg-gradient-to-br from-primary/10 to-background">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
            Prêt à découvrir ?
          </h2>
          <p className="text-lg text-muted-foreground">
            Rejoignez des milliers de mélomanes qui ont choisi de posséder leur musique
          </p>
          <Link to="/register" data-testid="cta-register-link">
            <Button size="lg" className="rounded-full px-8 py-6 text-lg shadow-lg shadow-primary/25" data-testid="cta-register-button">
              Créer mon compte gratuitement
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;