import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import {
  TOUR_EVENT,
  advanceProductTour,
  getProductTourState,
  skipProductTour
} from '@/lib/productTour';

const PAD = 10;
const pathOf = (location) => `${location.pathname}${location.search || ''}`;
const samePath = (a, b) => {
  const left = String(a || '').replace(/\/$/, '') || '/';
  const right = String(b || '').replace(/\/$/, '') || '/';
  return left === right;
};

const measure = (el) => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 8 && r.height < 8) return null;
  return {
    top: Math.max(8, r.top - PAD),
    left: Math.max(8, r.left - PAD),
    width: Math.min(window.innerWidth - 16, r.width + PAD * 2),
    height: Math.min(window.innerHeight - 16, r.height + PAD * 2)
  };
};

const ProductTour = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [tour, setTour] = useState(null);
  const [box, setBox] = useState(null);

  const userId = user?.user_id;

  useEffect(() => {
    const sync = () => setTour(getProductTourState(userId));
    sync();
    window.addEventListener(TOUR_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(TOUR_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [userId]);

  const step = tour?.current;

  useEffect(() => {
    if (!step) return undefined;
    if (!samePath(pathOf(location), step.path)) {
      navigate(step.path);
      return undefined;
    }

    let cancelled = false;
    let tries = 0;
    let scrolled = false;
    const tick = () => {
      if (cancelled) return;
      const el = document.querySelector(`[data-kloud-tour="${step.target}"]`);
      const nextBox = measure(el);
      if (nextBox) {
        setBox(nextBox);
        if (!scrolled) {
          scrolled = true;
          el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
        }
        return;
      }
      setBox(null);
      if (tries < 24) {
        tries += 1;
        window.setTimeout(tick, 120);
      }
    };
    tick();
    const onMove = () => {
      const el = document.querySelector(`[data-kloud-tour="${step.target}"]`);
      setBox(measure(el));
    };
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      cancelled = true;
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [step, location, navigate]);

  if (!tour || !step || !userId) return null;

  const goNext = () => advanceProductTour(userId);
  const ignore = (e) => {
    e.stopPropagation();
    skipProductTour(userId);
  };

  const captionTop = box
    ? Math.min(
        window.innerHeight - 96,
        box.top + box.height + 12 > window.innerHeight - 90 ? Math.max(12, box.top - 76) : box.top + box.height + 12
      )
    : window.innerHeight / 2 - 32;
  const captionLeft = box
    ? Math.min(window.innerWidth - 280, Math.max(12, box.left))
    : 24;

  return (
    <AnimatePresence>
      <motion.div
        key={step.id}
        className="fixed inset-0 z-[70]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <button
          type="button"
          aria-label="Étape suivante"
          className="absolute inset-0 bg-black/25 cursor-pointer"
          onClick={goNext}
        />
        {box ? (
          <button
            type="button"
            aria-hidden
            onClick={goNext}
            className="absolute rounded-[1.6rem] border border-white/25 bg-white/[0.07] backdrop-blur-[6px] shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_8px_40px_rgba(0,0,0,0.25)] cursor-pointer"
            style={{
              top: box.top,
              left: box.left,
              width: box.width,
              height: box.height
            }}
          />
        ) : null}
        <div
          className="absolute pointer-events-auto"
          style={{ top: captionTop, left: captionLeft, width: 'min(16.5rem, calc(100vw - 1.5rem))' }}
        >
          <button
            type="button"
            onClick={goNext}
            className="w-full text-left glass-heavy rounded-2xl border border-white/15 px-4 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.28)]"
          >
            <p className="text-sm font-medium leading-snug">{step.text}</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="flex gap-1" aria-hidden>
                {tour.steps.map((_, i) => (
                  <span
                    key={tour.steps[i].id}
                    className={`h-1.5 rounded-full ${
                      i === tour.step ? 'w-4 bg-cyan-300' : 'w-1.5 bg-white/25'
                    }`}
                  />
                ))}
              </span>
              <span className="text-[11px] text-muted-foreground">Cliquer</span>
            </div>
          </button>
          <button
            type="button"
            onClick={ignore}
            className="mt-2 ml-1 text-[11px] text-muted-foreground/80 hover:text-foreground"
            data-testid="product-tour-ignore"
          >
            Ignorer
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProductTour;
