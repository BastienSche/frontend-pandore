import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Maximize2, Minimize2, Pause, Play, RotateCcw } from 'lucide-react';

const SCENES = [
  {
    id: 'brand',
    durationMs: 6200,
    image: '/presentation/kloud-present-intro.jpg',
    kicker: null,
    brand: 'Kloud',
    line: 'La musique que tu gardes.',
    support: null,
  },
  {
    id: 'discover',
    durationMs: 5600,
    image: '/presentation/kloud-present-discover.jpg',
    kicker: 'Découvrir',
    brand: null,
    line: 'Explore des artistes indépendants.',
    support: 'Écoute, like, suis — sans abonnement qui t’enferme.',
  },
  {
    id: 'own',
    durationMs: 5800,
    image: '/presentation/kloud-present-own.jpg',
    kicker: 'Posséder',
    brand: null,
    line: 'Tu achètes. Tu télécharges. C’est à toi.',
    support: 'Fichier complet, bibliothèque perso, zéro preview bridée.',
  },
  {
    id: 'artists',
    durationMs: 5400,
    image: '/presentation/kloud-present-intro.jpg',
    kicker: 'Artistes',
    brand: null,
    line: 'Vends direct. Garde le lien avec ton public.',
    support: 'Une boutique claire, des stats utiles, un vrai revenu.',
  },
  {
    id: 'cta',
    durationMs: 7000,
    image: '/presentation/kloud-present-discover.jpg',
    kicker: 'Kloud',
    brand: null,
    line: 'Moins de stream jetable. Plus de collection.',
    support: 'Entre dans le catalogue.',
    cta: true,
  },
];

const TOTAL_MS = SCENES.reduce((sum, s) => sum + s.durationMs, 0);

function sceneAt(elapsedMs) {
  let t = elapsedMs % TOTAL_MS;
  for (let i = 0; i < SCENES.length; i += 1) {
    if (t < SCENES[i].durationMs) {
      return { index: i, localMs: t, scene: SCENES[i] };
    }
    t -= SCENES[i].durationMs;
  }
  return { index: 0, localMs: 0, scene: SCENES[0] };
}

const SitePresentation = () => {
  const rootRef = useRef(null);
  const rafRef = useRef(null);
  const lastTsRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const { index, scene, localMs } = useMemo(() => sceneAt(elapsed), [elapsed]);
  const sceneProgress = Math.min(1, localMs / scene.durationMs);
  const globalProgress = Math.min(1, (elapsed % TOTAL_MS) / TOTAL_MS);

  const tick = useCallback((ts) => {
    if (lastTsRef.current == null) lastTsRef.current = ts;
    const delta = ts - lastTsRef.current;
    lastTsRef.current = ts;
    setElapsed((prev) => prev + delta);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (!playing) {
      lastTsRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return undefined;
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, tick]);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === 'r' || e.key === 'R') {
        setElapsed(0);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleFullscreen = async () => {
    const el = rootRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) await el.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      // ignore
    }
  };

  const restart = () => {
    setElapsed(0);
    setPlaying(true);
  };

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[100] bg-[#05070f] text-white overflow-hidden select-none"
      style={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Scenes */}
      <AnimatePresence mode="wait">
        <motion.div
          key={scene.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: scene.durationMs / 1000, ease: 'linear' }}
            style={{
              backgroundImage: `url(${scene.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/80" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(5,7,15,0.55)_70%)]" />

          {/* Soft moving light */}
          <motion.div
            className="pointer-events-none absolute -inset-20 opacity-40"
            animate={{
              background: [
                'radial-gradient(600px 400px at 20% 30%, rgba(34,211,238,0.22), transparent 60%)',
                'radial-gradient(600px 400px at 75% 45%, rgba(168,85,247,0.18), transparent 60%)',
                'radial-gradient(600px 400px at 40% 70%, rgba(34,211,238,0.16), transparent 60%)',
              ],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="relative z-10 h-full flex flex-col justify-end md:justify-center px-8 md:px-16 lg:px-24 pb-28 md:pb-0">
            <div className="max-w-4xl">
              {scene.kicker && (
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.7 }}
                  className="mb-5 text-[11px] md:text-xs uppercase tracking-[0.42em] text-cyan-200/80"
                >
                  {scene.kicker}
                </motion.div>
              )}

              {scene.brand && (
                <motion.h1
                  initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ delay: 0.15, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                  className="text-7xl sm:text-8xl md:text-9xl font-extrabold tracking-tighter leading-none"
                >
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300">
                    {scene.brand}
                  </span>
                </motion.h1>
              )}

              <motion.p
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: scene.brand ? 0.55 : 0.35, duration: 0.85 }}
                className={`${
                  scene.brand
                    ? 'mt-6 text-2xl md:text-4xl font-medium tracking-tight text-white/90'
                    : 'text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter leading-[1.05]'
                }`}
              >
                {scene.line}
              </motion.p>

              {scene.support && (
                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.75 }}
                  className="mt-5 max-w-xl text-base md:text-lg text-white/65 leading-relaxed"
                >
                  {scene.support}
                </motion.p>
              )}

              {scene.cta && (
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.95, duration: 0.7 }}
                  className="mt-10 flex flex-wrap gap-3"
                >
                  <Link
                    to="/browse"
                    className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-400 px-7 py-3.5 text-sm font-semibold text-zinc-950 hover:opacity-95 transition-opacity"
                  >
                    Explorer le catalogue
                  </Link>
                  <Link
                    to="/"
                    className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 px-7 py-3.5 text-sm font-medium text-white/90 backdrop-blur-md hover:bg-white/10 transition-colors"
                  >
                    Retour à l’accueil
                  </Link>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress + controls */}
      <div className="absolute inset-x-0 bottom-0 z-20 px-5 md:px-8 pb-5 pt-16 bg-gradient-to-t from-black/70 to-transparent">
        <div className="mb-3 flex gap-1.5">
          {SCENES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Aller à la scène ${i + 1}`}
              onClick={() => {
                const start = SCENES.slice(0, i).reduce((sum, x) => sum + x.durationMs, 0);
                setElapsed(start);
              }}
              className="h-1 flex-1 rounded-full bg-white/15 overflow-hidden"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-fuchsia-300 transition-[width] duration-100 ease-linear"
                style={{
                  width:
                    i < index ? '100%' : i === index ? `${Math.round(sceneProgress * 100)}%` : '0%',
                }}
              />
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 hover:bg-white/15 transition-colors"
              aria-label={playing ? 'Pause' : 'Lecture'}
            >
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <button
              type="button"
              onClick={restart}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 hover:bg-white/15 transition-colors"
              aria-label="Recommencer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 hover:bg-white/15 transition-colors"
              aria-label="Plein écran"
            >
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          <div className="hidden sm:block text-[11px] uppercase tracking-[0.28em] text-white/45">
            {String(index + 1).padStart(2, '0')} / {String(SCENES.length).padStart(2, '0')}
            <span className="mx-3 text-white/20">·</span>
            Espace pause · F plein écran
          </div>

          <div className="h-1 w-24 md:w-40 rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full bg-white/70"
              style={{ width: `${Math.round(globalProgress * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SitePresentation;
