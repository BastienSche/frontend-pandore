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

const PAD = 7;
const MAX_W = 300;
const MAX_H = 88;
const pathOf = (location) => `${location.pathname}${location.search || ''}`;
const samePath = (a, b) => {
  const left = String(a || '').replace(/\/$/, '') || '/';
  const right = String(b || '').replace(/\/$/, '') || '/';
  return left === right;
};

const pickHotEl = (el) => {
  if (!el) return null;
  if (el.matches('button, a, input, textarea, [role="tab"], [role="button"]')) return el;
  const r = el.getBoundingClientRect();
  if (r.width > 8 && r.height > 8 && r.width <= 380 && r.height <= 420) return el;
  return (
    el.querySelector('button, a, input, textarea, [role="tab"], [role="button"]') || el
  );
};

const pickBestEl = (target) => {
  const nodes = [...document.querySelectorAll(`[data-kloud-tour="${target}"]`)];
  if (!nodes.length) return null;
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  return nodes
    .map((node) => {
      const r = node.getBoundingClientRect();
      const area = Math.max(1, r.width * r.height);
      const dx = r.left + r.width / 2 - cx;
      const dy = r.top + r.height / 2 - cy;
      return { node, score: area + (dx * dx + dy * dy) / 20 };
    })
    .sort((a, b) => a.score - b.score)[0].node;
};

const measure = (el) => {
  const hot = pickHotEl(el);
  if (!hot) return null;
  const r = hot.getBoundingClientRect();
  if (r.width < 8 && r.height < 8) return null;

  let width = r.width;
  let height = r.height;
  let left = r.left;
  let top = r.top;

  if (width > MAX_W) {
    width = MAX_W;
  }
  if (height > MAX_H) {
    top = r.bottom - MAX_H;
    height = MAX_H;
  }

  return {
    top: Math.max(8, top - PAD),
    left: Math.max(8, left - PAD),
    width: Math.min(window.innerWidth - 16, width + PAD * 2),
    height: Math.min(window.innerHeight - 16, height + PAD * 2),
    radius: Math.min(22, (height + PAD * 2) / 2)
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
      const el = pickBestEl(step.target);
      const nextBox = measure(el);
      if (nextBox) {
        setBox(nextBox);
        if (!scrolled) {
          scrolled = true;
          el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
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
      setBox(measure(pickBestEl(step.target)));
    };
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      cancelled = true;
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [step, location, navigate]);

  useEffect(() => {
    if (!step || !userId) return undefined;
    const onClick = (e) => {
      if (step.stay) return;
      const el = pickBestEl(step.target);
      if (!el || !el.contains(e.target)) return;
      if (e.target.closest('input, textarea')) return;
      window.setTimeout(() => advanceProductTour(userId), 40);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [step, userId]);

  if (!tour || !step || !userId || !box) return null;

  const ignore = (e) => {
    e.stopPropagation();
    skipProductTour(userId);
  };

  const spaceBelow = window.innerHeight - (box.top + box.height);
  const placeAbove = spaceBelow < 72 && box.top > 72;
  const captionTop = placeAbove ? box.top - 56 : box.top + box.height + 10;
  const captionLeft = Math.min(
    window.innerWidth - 268,
    Math.max(12, box.left + box.width / 2 - 130)
  );

  const panes = [
    { top: 0, left: 0, width: '100%', height: box.top },
    { top: box.top, left: 0, width: box.left, height: box.height },
    {
      top: box.top,
      left: box.left + box.width,
      width: Math.max(0, window.innerWidth - (box.left + box.width)),
      height: box.height
    },
    {
      top: box.top + box.height,
      left: 0,
      width: '100%',
      height: Math.max(0, window.innerHeight - (box.top + box.height))
    }
  ];

  return (
    <AnimatePresence>
      <motion.div
        key={step.id}
        className="fixed inset-0 z-[70] pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
      >
        {panes.map((pane, i) => (
          <div
            key={i}
            className="absolute bg-[#020814]/55 pointer-events-auto"
            style={pane}
          />
        ))}

        <div
          className="absolute pointer-events-none"
          style={{
            top: box.top,
            left: box.left,
            width: box.width,
            height: box.height,
            borderRadius: box.radius,
            boxShadow:
              '0 0 0 2px rgba(34,211,238,0.75), 0 0 22px 2px rgba(168,85,247,0.35), 0 0 0 9999px rgba(2,8,20,0.0)',
            animation: 'kloud-tour-pulse 1.6s ease-in-out infinite'
          }}
        />

        <div
          className="absolute pointer-events-auto"
          style={{
            top: captionTop,
            left: captionLeft,
            width: 'min(16rem, calc(100vw - 1.5rem))'
          }}
        >
          <div className="flex items-center gap-2 rounded-full border border-cyan-400/30 bg-[#07111f]/92 px-3 py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-sm">
            <p className="text-[12px] leading-none font-medium text-white/90 truncate">
              {step.text}
            </p>
            {step.stay ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  advanceProductTour(userId);
                }}
                className="shrink-0 text-[11px] text-cyan-300 hover:text-cyan-100"
              >
                OK
              </button>
            ) : null}
            <button
              type="button"
              onClick={ignore}
              className="shrink-0 text-[11px] text-white/45 hover:text-white/90"
              data-testid="product-tour-ignore"
            >
              Ignorer
            </button>
          </div>
        </div>

        <style>{`
          @keyframes kloud-tour-pulse {
            0%, 100% { box-shadow: 0 0 0 2px rgba(34,211,238,0.7), 0 0 18px 1px rgba(168,85,247,0.28); }
            50% { box-shadow: 0 0 0 3px rgba(34,211,238,1), 0 0 28px 4px rgba(168,85,247,0.45); }
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProductTour;
