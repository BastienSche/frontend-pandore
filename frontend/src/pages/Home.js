import React from 'react';
import { Link } from 'react-router-dom';
import { Music, Play, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const Home = () => {
  return (
    <div className="min-h-screen">
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
        </div>
      </section>

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