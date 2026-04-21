import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Cloud, Download, HandHeart, Headphones, Music, Sparkles, Store } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BubbleBackground, GlowOrb } from '@/components/BubbleCard';
import { useAuth } from '@/hooks/useAuth';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } }
};

const FeatureCard = ({ Icon, title, description, gradient }) => (
  <motion.div variants={itemVariants} className="h-full">
    <div className="h-full glass-heavy rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-colors">
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6`}>
        <Icon className="w-7 h-7 text-zinc-900/90 dark:text-black/80" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

const StepCard = ({ n, title, description }) => (
  <motion.div variants={itemVariants} className="h-full">
    <div className="h-full glass-heavy rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-semibold">
          {n}
        </div>
        <h3 className="text-xl font-semibold">{title}</h3>
      </div>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

const Discover = () => {
  const { isAuthenticated } = useAuth();

  const primaryCtaTo = isAuthenticated ? '/browse' : '/register';
  const primaryCtaLabel = isAuthenticated ? 'Explorer le catalogue' : 'Créer un compte';

  return (
    <div className="min-h-screen pb-32 relative overflow-hidden">
      <BubbleBackground />
      <GlowOrb color="cyan" size={520} x="15%" y="20%" blur={130} />
      <GlowOrb color="purple" size={440} x="85%" y="65%" blur={120} />

      <div className="relative pt-28 pb-14 px-6 md:px-12">
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <Badge className="mb-5 bg-primary/10 border border-primary/30 text-primary rounded-full px-5 py-2">
              <Sparkles className="w-4 h-4 mr-2 inline" />
              Pas de baratin, juste la musique
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-5">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                Kloud, c’est simple.
              </span>
            </h1>
            <div className="max-w-3xl space-y-3">
              <p className="text-lg text-muted-foreground leading-relaxed">
                Ici on ne va pas te vendre du rêve. Kloud, c’est une <span className="text-foreground font-medium">boutique de musique</span> :
                tu achètes un titre ou un album, tu le télécharges, et <span className="text-foreground font-medium">tu le gardes</span>.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Et ça veut dire un truc très concret : pas “tu payes tous les mois sinon tu perds tout”.
                Tu collectionnes ce que tu aimes, point.
              </p>
              <p className="text-sm text-muted-foreground/80">
                Oui, c’est un peu l’esprit Marseille : direct, propre, efficace.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="mt-9 flex flex-col sm:flex-row gap-3"
          >
            <Link to={primaryCtaTo} data-testid="discover-primary-cta">
              <Button
                size="lg"
                className="rounded-full px-10 py-7 text-lg bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 border-0 shadow-[0_0_30px_rgba(34,211,238,0.28)] hover:shadow-[0_0_45px_rgba(34,211,238,0.48)] transition-shadow"
              >
                {primaryCtaLabel}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/library" data-testid="discover-secondary-cta">
              <Button size="lg" variant="outline" className="rounded-full px-10 py-7 text-lg glass border-white/20 hover:bg-white/10">
                Aller à ma bibliothèque
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-12 py-10 relative z-10">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants} className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Ce que Kloud fait (et ne fait pas)</h2>
            <p className="mt-3 text-muted-foreground max-w-3xl leading-relaxed">
              Kloud n’essaie pas de remplacer ton player préféré. On fait un truc précis : te laisser acheter de la musique et la garder.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            <FeatureCard
              Icon={Download}
              title="Tu payes, tu récupères"
              description="Tu achètes, tu télécharges. Après, c’est à toi. Pas d’entourloupe, pas de “location”."
              gradient="from-cyan-400 to-purple-400"
            />
            <FeatureCard
              Icon={HandHeart}
              title="Plus propre pour les artistes"
              description="Ton achat a du poids. Tu soutiens la création avec une logique claire, pas des micro-centimes flous."
              gradient="from-purple-400 to-pink-400"
            />
            <FeatureCard
              Icon={Headphones}
              title="Découvrir, puis collectionner"
              description="Tu écoutes, tu explores, et quand tu kiffes, tu le mets dans ta bibliothèque (tes achats)."
              gradient="from-pink-400 to-cyan-400"
            />
          </div>

          <motion.div variants={itemVariants} className="mt-12">
            <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">Comment ça marche</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
              <StepCard
                n="1"
                title="Tu explores"
                description="Parcours le catalogue, écoute des extraits, tombe sur des pépites. Tranquille."
              />
              <StepCard
                n="2"
                title="Tu achètes"
                description="Quand tu veux vraiment garder un morceau ou un album, tu l’achètes. Clair."
              />
              <StepCard
                n="3"
                title="Tu gardes"
                description="Ça atterrit dans ta bibliothèque et tu peux le télécharger. Ta musique, chez toi."
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-12 glass-heavy rounded-[2.5rem] p-10 border border-white/10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <Cloud className="w-6 h-6 text-cyan-300" />
              </div>
              <div className="min-w-0">
                <h3 className="text-2xl font-semibold mb-2">Découvrir vs Bibliothèque</h3>
                <p className="text-muted-foreground leading-relaxed">
                  <span className="text-foreground font-medium">Découvrir</span> c’est l’entrée : comprendre le concept et aller explorer.
                  <span className="text-foreground font-medium"> Bibliothèque</span> c’est ton coffre : ce que tu as acheté, ce que tu possèdes.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Link to={isAuthenticated ? '/browse' : '/login'} data-testid="discover-explore-link">
                    <Button className="rounded-full" variant="secondary">
                      <Music className="w-4 h-4 mr-2" />
                      Explorer maintenant
                    </Button>
                  </Link>
                  {!isAuthenticated && (
                    <Link to="/register" data-testid="discover-register-link">
                      <Button className="rounded-full" variant="outline">
                        Créer mon compte
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-7">
            <div className="glass-heavy rounded-3xl p-8 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Store className="w-6 h-6 text-purple-300" />
                </div>
                <h3 className="text-2xl font-semibold">Pour les artistes</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Tu publies, tu vends, et tu construis une base de gens qui possèdent ton travail. Moins de bruit, plus de valeur.
              </p>
            </div>

            <div className="glass-heavy rounded-3xl p-8 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <BadgeCheck className="w-6 h-6 text-cyan-300" />
                </div>
                <h3 className="text-2xl font-semibold">Pour les auditeurs</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Tu découvres, tu achètes ce que tu veux vraiment, et tu sais pourquoi tu payes. Pas de promesse floue.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Discover;

