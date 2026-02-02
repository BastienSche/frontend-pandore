import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Music, Play, TrendingUp, Sparkles, ArrowRight, Disc, Star, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import TrackCard from '@/components/TrackCard';
import AlbumCard from '@/components/AlbumCard';
import { BubbleBackground, GlowOrb } from '@/components/BubbleCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const floatVariants = {
  animate: (i) => ({
    y: [-10, 10, -10],
    transition: {
      duration: 5 + i,
      repeat: Infinity,
      ease: "easeInOut"
    }
  })
};

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
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <BubbleBackground />
      
      {/* Glow Orbs */}
      <GlowOrb color="cyan" size={600} x="20%" y="30%" blur={150} />
      <GlowOrb color="purple" size={500} x="80%" y="60%" blur={120} />
      <GlowOrb color="pink" size={400} x="50%" y="90%" blur={100} />

      {/* Hero Section */}
      <section className="relative min-h-[95vh] flex items-center justify-center px-6 overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1726650683763-a6ba2bf5ea27?crop=entropy&cs=srgb&fm=jpg&q=85')`,
            filter: 'blur(2px)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
        
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6"
          >
            {/* Floating Badge */}
            <motion.div
              custom={2}
              variants={floatVariants}
              animate="animate"
              className="inline-block"
            >
              <Badge 
                className="px-6 py-2 text-sm bg-primary/10 border border-primary/30 text-primary rounded-full backdrop-blur-md"
                data-testid="hero-badge"
              >
                <Headphones className="w-4 h-4 mr-2 inline" />
                La musique vous appartient
              </Badge>
            </motion.div>

            <h1 
              className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-tighter leading-none"
              data-testid="hero-title"
            >
              <span className="text-foreground">Possédez votre</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 text-glow-cyan">
                musique
              </span>
            </h1>
            
            <p 
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              data-testid="hero-description"
            >
              Pandore réinvente l'achat de musique numérique. Achetez, téléchargez et gardez vos titres préférés pour toujours.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/register" data-testid="hero-register-link">
              <Button 
                size="lg" 
                className="rounded-full px-10 py-7 text-lg bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 border-0 shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:shadow-[0_0_40px_rgba(34,211,238,0.5)] transition-shadow"
                data-testid="hero-register-button"
              >
                <Play className="w-5 h-5 mr-2" />
                Commencer gratuitement
              </Button>
            </Link>
            
            <Link to="/browse" data-testid="hero-browse-link">
              <Button 
                size="lg" 
                variant="outline" 
                className="rounded-full px-10 py-7 text-lg glass border-white/20 hover:bg-white/10 hover:border-white/30"
                data-testid="hero-browse-button"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Découvrir
              </Button>
            </Link>
          </motion.div>

          {/* Floating Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex justify-center gap-8 md:gap-16 pt-12"
          >
            {[
              { value: "500+", label: "Titres", delay: 0 },
              { value: "50+", label: "Artistes", delay: 1 },
              { value: "75+", label: "Albums", delay: 2 }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                custom={stat.delay}
                variants={floatVariants}
                animate="animate"
                className="text-center glass-bubble rounded-2xl px-6 py-4"
              >
                <div className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2">
            <div className="w-1 h-2 bg-primary rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* New Releases - Floating Cards */}
      <section className="relative py-32 px-6 md:px-12">
        <GlowOrb color="cyan" size={400} x="10%" y="50%" blur={100} />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="flex items-end justify-between mb-12">
              <div>
                <Badge className="mb-4 bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                  Fraîchement sorti
                </Badge>
                <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
                  Nouveautés
                </h2>
                <p className="text-muted-foreground mt-2 text-lg">Les dernières sorties des artistes</p>
              </div>
              <Link to="/browse">
                <Button variant="ghost" className="rounded-full glass hover:bg-white/10">
                  Tout voir <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-square rounded-3xl glass animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {newReleases.map((track, index) => (
                  <motion.div
                    key={track.track_id}
                    variants={itemVariants}
                    custom={index}
                    className={`animate-float-gentle stagger-${index + 1}`}
                    style={{ animationDelay: `${index * 0.2}s` }}
                  >
                    <TrackCard track={track} />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Top Tracks */}
      <section className="relative py-32 px-6 md:px-12">
        <GlowOrb color="purple" size={500} x="90%" y="30%" blur={120} />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="flex items-center gap-4 mb-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
                  Top du moment
                </h2>
                <p className="text-muted-foreground text-lg">Les tracks les plus aimés</p>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {topTracks.map((track, index) => (
                <motion.div 
                  key={track.track_id} 
                  variants={itemVariants}
                  className="relative"
                >
                  <Badge 
                    className="absolute -top-3 -left-3 z-20 w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 border-0 text-white font-bold shadow-lg"
                  >
                    {index + 1}
                  </Badge>
                  <TrackCard track={track} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Albums */}
      <section className="relative py-32 px-6 md:px-12">
        <GlowOrb color="pink" size={400} x="20%" y="60%" blur={100} />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="flex items-center gap-4 mb-12">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500/20 to-orange-500/20 flex items-center justify-center border border-pink-500/30 animate-breathe">
                <Disc className="w-8 h-8 text-pink-400" />
              </div>
              <div>
                <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
                  Albums
                </h2>
                <p className="text-muted-foreground text-lg">Collections complètes à découvrir</p>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {featuredAlbums.map((album, index) => (
                <motion.div 
                  key={album.album_id}
                  variants={itemVariants}
                  className={`animate-float-slow stagger-${(index % 4) + 1}`}
                >
                  <AlbumCard album={album} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Artists - Circular Bubbles */}
      <section className="relative py-32 px-6 md:px-12">
        <GlowOrb color="cyan" size={500} x="70%" y="40%" blur={120} />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="flex items-center gap-4 mb-12">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/30 animate-glow-pulse">
                <Star className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
                  Artistes
                </h2>
                <p className="text-muted-foreground text-lg">Les talents de la plateforme</p>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {featuredArtists.map((artist, index) => (
                <motion.div
                  key={artist.user_id}
                  variants={itemVariants}
                  custom={index}
                >
                  <Link to={`/artist/${artist.user_id}`}>
                    <motion.div
                      className="group relative text-center"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="relative mx-auto w-40 h-40 md:w-48 md:h-48">
                        {/* Glow ring */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <Avatar className="w-full h-full border-2 border-white/10 group-hover:border-cyan-400/50 transition-colors duration-300 shadow-2xl">
                          <AvatarImage src={artist.picture} className="object-cover" />
                          <AvatarFallback className="text-4xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
                            {artist.artist_name?.[0] || artist.name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      
                      <div className="mt-4 space-y-1">
                        <h3 className="font-semibold text-lg group-hover:text-cyan-400 transition-colors">
                          {artist.artist_name || artist.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">Artiste</p>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Pandore - Glass Cards */}
      <section className="relative py-32 px-6 md:px-12">
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
                Pourquoi <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Pandore</span> ?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Une nouvelle approche de la musique numérique
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Music,
                  title: "Vraie propriété",
                  description: "Achetez une fois, gardez pour toujours. Téléchargez vos titres et écoutez-les même hors ligne.",
                  color: "cyan",
                  testId: "feature-ownership"
                },
                {
                  icon: TrendingUp,
                  title: "Soutenez les artistes",
                  description: "Les artistes reçoivent une part équitable. Pas d'intermédiaires, juste vous et la musique.",
                  color: "purple",
                  testId: "feature-artists"
                },
                {
                  icon: Sparkles,
                  title: "Haute qualité",
                  description: "Fichiers audio haute qualité, sans compression. La musique comme l'artiste l'a voulue.",
                  color: "pink",
                  testId: "feature-quality"
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  custom={index}
                  className={`animate-float-gentle stagger-${index + 1}`}
                  data-testid={feature.testId}
                >
                  <motion.div
                    className="h-full p-8 rounded-3xl glass-heavy hover:border-white/20 transition-colors duration-300"
                    whileHover={{ y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className={`w-14 h-14 rounded-2xl bg-${feature.color}-500/10 flex items-center justify-center mb-6 border border-${feature.color}-500/30`}>
                      <feature.icon className={`w-7 h-7 text-${feature.color}-400`} />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-6 md:px-12">
        <GlowOrb color="cyan" size={600} x="50%" y="50%" blur={150} />
        
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-8 glass-heavy rounded-[3rem] p-12 md:p-16"
          >
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
              Prêt à <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">découvrir</span> ?
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Rejoignez des milliers de mélomanes qui ont choisi de posséder leur musique
            </p>
            <Link to="/register" data-testid="cta-register-link">
              <Button 
                size="lg" 
                className="rounded-full px-12 py-7 text-lg bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 border-0 shadow-[0_0_40px_rgba(34,211,238,0.4)] hover:shadow-[0_0_50px_rgba(34,211,238,0.6)] transition-shadow"
                data-testid="cta-register-button"
              >
                Créer mon compte gratuitement
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Spacer for audio player */}
      <div className="h-32" />
    </div>
  );
};

export default Home;
