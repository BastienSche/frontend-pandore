import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, HeartHandshake, MapPin, Music, Sparkles, Waves } from 'lucide-react';
import { motion } from 'framer-motion';
import { BubbleBackground, GlowOrb } from '@/components/BubbleCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 }
  }
};

const SectionTitle = ({ kicker, title, subtitle }) => (
  <motion.div variants={itemVariants} className="mb-8">
    {kicker && (
      <div className="text-xs uppercase tracking-[0.28em] text-muted-foreground/80">
        {kicker}
      </div>
    )}
    <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">{title}</h2>
    {subtitle && <p className="mt-3 text-muted-foreground max-w-3xl leading-relaxed">{subtitle}</p>}
  </motion.div>
);

const GlassCard = ({ Icon, title, children, gradient = 'from-cyan-400 to-purple-400' }) => (
  <motion.div variants={itemVariants} className="h-full">
    <div className="group h-full glass-heavy rounded-[28px] p-8 border border-white/10 hover:border-white/20 transition-colors shadow-[0_12px_50px_rgba(0,0,0,0.18)]">
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute -inset-32 bg-gradient-to-r from-white/0 via-white/[0.06] to-white/0 rotate-12" />
      </div>
      <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} opacity-90 flex items-center justify-center mb-6`}>
        <Icon className="w-7 h-7 text-zinc-900/90 dark:text-black/80" />
      </div>
      <h3 className="relative text-xl font-semibold mb-2">{title}</h3>
      <div className="relative text-muted-foreground leading-relaxed text-sm">{children}</div>
    </div>
  </motion.div>
);

const NousDecouvrir = () => {
  return (
    <div className="min-h-screen pb-32 relative overflow-hidden">
      <BubbleBackground />
      <GlowOrb color="cyan" size={700} x="8%" y="18%" blur={170} />
      <GlowOrb color="purple" size={640} x="92%" y="62%" blur={170} />
      <GlowOrb color="pink" size={520} x="60%" y="92%" blur={150} />

      {/* Hero */}
      <div className="relative pt-28 pb-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className="bg-white/5 border border-white/10 text-foreground/90 rounded-full px-4 py-1.5 backdrop-blur-md">
                <Sparkles className="w-4 h-4 mr-2 inline" />
                Page “single”, hors menu
              </Badge>
              <Badge className="bg-white/5 border border-white/10 text-foreground/90 rounded-full px-4 py-1.5 backdrop-blur-md">
                <MapPin className="w-4 h-4 mr-2 inline" />
                Marseille → internet
              </Badge>
            </div>

            <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
              <div className="lg:col-span-8">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[0.95]">
                  Nous découvrir.
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
                    Kloud
                  </span>
                </h1>
                <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
                  Kloud est un projet né à Marseille, avec une idée simple : remettre la{' '}
                  <span className="text-foreground font-medium">propriété</span> au centre de la musique numérique.
                </p>
                <p className="mt-3 text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
                  Tu découvres, tu écoutes, tu achètes ce que tu veux garder, et tu le retrouves dans ta bibliothèque.
                  Pas de discours corporate. Juste un produit propre, beau, utile.
                </p>
              </div>

              <div className="lg:col-span-4">
                <div className="glass-heavy rounded-[32px] p-7 border border-white/10 shadow-[0_18px_70px_rgba(0,0,0,0.22)]">
                  <div className="text-xs uppercase tracking-[0.28em] text-muted-foreground/80">En deux lignes</div>
                  <div className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    On adore le streaming pour découvrir.
                    <br />
                    On veut l’achat pour garder.
                  </div>
                  <div className="mt-6 flex flex-col gap-3">
                    <Link to="/browse">
                      <Button className="rounded-full w-full" size="lg">
                        Explorer le catalogue
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                    <Link to="/">
                      <Button className="rounded-full w-full" size="lg" variant="outline">
                        Retour accueil
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <motion.div initial="hidden" animate="visible" variants={containerVariants}>
          <motion.div variants={itemVariants} className="glass-heavy rounded-[40px] p-10 md:p-12 border border-white/10 shadow-[0_18px_70px_rgba(0,0,0,0.2)]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Waves className="w-6 h-6 text-cyan-300" />
                  </div>
                  <div className="text-xs uppercase tracking-[0.28em] text-muted-foreground/80">Le point de départ</div>
                </div>
                <div className="mt-4 text-2xl md:text-3xl font-semibold tracking-tight">
                  On ne veut pas perdre sa musique.
                </div>
              </div>
              <div className="lg:col-span-8">
                <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
                  On aime le streaming pour découvrir. Mais on n’aime pas l’idée qu’une discographie entière disparaisse si tu arrêtes de payer.
                  Kloud part de là : <span className="text-foreground font-medium">si tu aimes vraiment, tu peux posséder</span>.
                </p>
                <p className="mt-4 text-muted-foreground leading-relaxed text-base md:text-lg">
                  Acheter un morceau, c’est un geste simple. Ça crée un lien, ça respecte le travail, et ça remet de la valeur là où elle doit être.
                </p>
              </div>
            </div>
          </motion.div>

          <div className="mt-14">
            <SectionTitle
              kicker="Le produit"
              title="Trois gestes, zéro détour"
              subtitle="Un parcours simple: découvrir → acheter → garder. Le reste, c’est du bruit."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard Icon={Compass} title="Découvrir">
              Parcourir, écouter des extraits, tomber sur une vibe. Kloud est pensé pour que l’exploration reste fluide, sans friction.
            </GlassCard>
            <GlassCard Icon={Music} title="Acheter & garder" gradient="from-purple-400 to-pink-400">
              Quand tu veux vraiment conserver un titre ou un album, tu l’achètes. Il va dans ta bibliothèque. Tu ne “loues” pas ta musique.
            </GlassCard>
            <GlassCard Icon={HeartHandshake} title="Soutenir proprement" gradient="from-pink-400 to-cyan-400">
              On veut une relation plus directe et plus lisible entre auditeurs et artistes. Pas de métriques opaques. Un achat = une valeur claire.
            </GlassCard>
          </div>

          <motion.div variants={itemVariants} className="mt-14">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-heavy rounded-[32px] p-10 border border-white/10 shadow-[0_16px_60px_rgba(0,0,0,0.18)]">
                <div className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Origine</div>
                <h3 className="mt-2 text-3xl font-semibold tracking-tight">Marseille</h3>
                <p className="mt-4 text-muted-foreground leading-relaxed text-base md:text-lg">
                  Marseille c’est le réel : ça se voit quand c’est faux, et ça se sent quand c’est bon. On garde cette logique dans le produit :
                  pas d’habillage inutile, pas de promesse floue — du concret et du style.
                </p>
              </div>

              <div className="glass-heavy rounded-[32px] p-10 border border-white/10 shadow-[0_16px_60px_rgba(0,0,0,0.18)]">
                <div className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Manifeste</div>
                <h3 className="mt-2 text-3xl font-semibold tracking-tight">Propriété, clarté, esthétique</h3>
                <div className="mt-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-cyan-400/80" />
                    <div className="text-muted-foreground leading-relaxed text-base md:text-lg">
                      <span className="text-foreground font-medium">Propriété</span> : ce que tu achètes, tu le gardes.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-purple-400/80" />
                    <div className="text-muted-foreground leading-relaxed text-base md:text-lg">
                      <span className="text-foreground font-medium">Clarté</span> : un geste, un résultat. Pas de détour.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-pink-400/80" />
                    <div className="text-muted-foreground leading-relaxed text-base md:text-lg">
                      <span className="text-foreground font-medium">Esthétique</span> : un produit peut être simple et beau, sans faire semblant.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-14 glass-heavy rounded-[40px] p-10 md:p-12 border border-white/10 shadow-[0_18px_70px_rgba(0,0,0,0.22)]">
            <div className="flex items-start justify-between gap-6 flex-col md:flex-row">
              <div className="min-w-0">
                <h3 className="text-3xl md:text-4xl font-semibold tracking-tight">Envie de voir ?</h3>
                <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl text-base md:text-lg">
                  Cette page est volontairement hors menu. Un lien suffit. Si tu es là, c’est que tu voulais comprendre le projet — merci.
                </p>
              </div>
              <div className="flex gap-3 shrink-0">
                <Link to="/browse">
                  <Button className="rounded-full" size="lg">
                    Explorer
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default NousDecouvrir;

