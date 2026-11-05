import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BubbleBackground, GlowOrb } from '@/components/BubbleCard';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    document.title = 'Page introuvable · Kloud';
    return () => {
      document.title = 'Kloud';
    };
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center">
      <BubbleBackground />
      <GlowOrb color="cyan" size={520} x="20%" y="30%" blur={160} />
      <GlowOrb color="purple" size={420} x="80%" y="70%" blur={140} />

      <div className="relative z-10 max-w-xl mx-auto px-6 py-32 text-center">
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground/80">Erreur 404</p>
        <h1 className="mt-4 text-5xl md:text-6xl font-bold tracking-tight">
          Cette page
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            n’existe pas
          </span>
        </h1>
        <p className="mt-5 text-muted-foreground">
          Aucune route pour <span className="text-foreground font-mono text-sm">{location.pathname}</span>.
          Tu as peut-être suivi un lien périmé.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button className="rounded-full h-12 px-8 bg-gradient-to-r from-cyan-500 to-purple-500 border-0 w-full sm:w-auto">
              Accueil
            </Button>
          </Link>
          <Link to="/browse">
            <Button variant="outline" className="rounded-full h-12 px-8 w-full sm:w-auto">
              Découvrir
            </Button>
          </Link>
          <Link to="/aide">
            <Button variant="ghost" className="rounded-full h-12 px-8 w-full sm:w-auto">
              Aide
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
