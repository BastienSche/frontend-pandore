import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const floatVariants = {
  initial: { y: 0 },
  animate: (custom) => ({
    y: [-5, -15, -5],
    transition: {
      duration: custom.duration || 6,
      repeat: Infinity,
      ease: "easeInOut",
      delay: custom.delay || 0
    }
  })
};

export const BubbleCard = ({ 
  children, 
  className = "", 
  delay = 0, 
  duration = 6,
  glowColor = "cyan",
  onClick,
  testId
}) => {
  const glowStyles = {
    cyan: "hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]",
    purple: "hover:shadow-[0_0_30px_rgba(139,92,246,0.2)]",
    pink: "hover:shadow-[0_0_30px_rgba(244,114,182,0.2)]"
  };

  return (
    <motion.div
      custom={{ delay, duration }}
      variants={floatVariants}
      initial="initial"
      animate="animate"
      whileHover={{ 
        scale: 1.02, 
        y: -20,
        transition: { duration: 0.3 }
      }}
      className={`
        bubble-card
        ${glowStyles[glowColor] || glowStyles.cyan}
        ${className}
      `}
      onClick={onClick}
      data-testid={testId}
    >
      {children}
    </motion.div>
  );
};

export const BubbleBackground = () => {
  const [bubbles, setBubbles] = useState(() =>
    Array.from({ length: 16 }, (_, i) => {
      // Mouvement de base plus doux au chargement
      const speedBase = 0.25 + Math.random() * 0.35;
      const angle = Math.random() * Math.PI * 2;

      return {
        id: i,
        size: Math.random() * 140 + 60,
        x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
        y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
        vx: Math.cos(angle) * speedBase,
        vy: Math.sin(angle) * speedBase,
        opacity: Math.random() * 0.08 + 0.03
      };
    })
  );

  const mouseRef = useRef({ x: null, y: null });
  const scrollDeltaRef = useRef(0);
  const lastScrollYRef = useRef(
    typeof window !== 'undefined' ? window.scrollY : 0
  );
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleScroll = () => {
      if (typeof window === 'undefined') return;
      const currentY = window.scrollY;
      const delta = currentY - lastScrollYRef.current;
      scrollDeltaRef.current = delta;
      lastScrollYRef.current = currentY;
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  useEffect(() => {
    let lastTime = performance.now();

    const animate = (time) => {
      const dt = Math.min((time - lastTime) / 16.67, 2);
      lastTime = time;

      if (typeof window === 'undefined') {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const width = window.innerWidth;
      const height = window.innerHeight;
      const mouse = mouseRef.current;

      setBubbles((prev) =>
        prev.map((bubble) => {
          let { x, y, vx, vy } = bubble;

          // Répulsion plus forte autour du curseur (aimant inversé)
          if (mouse.x !== null && mouse.y !== null) {
            const dx = x - mouse.x;
            const dy = y - mouse.y;
            const distSq = dx * dx + dy * dy;
            const radius = 220;
            if (distSq < radius * radius && distSq > 1) {
              const dist = Math.sqrt(distSq);
              const force = 0.25 / dist; // plus fort qu'avant
              vx += (dx / dist) * force;
              vy += (dy / dist) * force;
            }
          }

          // Quand on scroll vers le bas (delta > 0), les bulles montent, mais comme un petit coup de vent
          const scrollInfluence = scrollDeltaRef.current * 0.0006;
          vy -= scrollInfluence;

          // Friction un peu plus forte pour garder un mouvement doux
          const maxSpeed = 1.6;
          vx *= 0.99;
          vy *= 0.99;

          const speed = Math.sqrt(vx * vx + vy * vy);
          if (speed > maxSpeed) {
            vx = (vx / speed) * maxSpeed;
            vy = (vy / speed) * maxSpeed;
          }

          x += vx * dt * 16;
          y += vy * dt * 16;

          const radiusPx = bubble.size / 2;

          if (x - radiusPx < 0) {
            x = radiusPx;
            vx = Math.abs(vx) * 0.9;
          } else if (x + radiusPx > width) {
            x = width - radiusPx;
            vx = -Math.abs(vx) * 0.9;
          }

          if (y - radiusPx < 0) {
            y = radiusPx;
            vy = Math.abs(vy) * 0.9;
          } else if (y + radiusPx > height) {
            y = height - radiusPx;
            vy = -Math.abs(vy) * 0.9;
          }

          return {
            ...bubble,
            x,
            y,
            vx,
            vy
          };
        })
      );

      scrollDeltaRef.current *= 0.9;

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="absolute rounded-full will-change-transform"
          style={{
            width: bubble.size,
            height: bubble.size,
            transform: `translate(${bubble.x - bubble.size / 2}px, ${
              bubble.y - bubble.size / 2
            }px)`,
            background: `radial-gradient(circle at 30% 30%, rgba(34, 211, 238, ${bubble.opacity}), transparent 70%)`,
            border: `1px solid rgba(255, 255, 255, ${bubble.opacity / 2})`
          }}
        />
      ))}
    </div>
  );
};

const NoteSvg = ({ variant = 0 }) => {
  const baseProps = {
    viewBox: '0 0 64 64',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg'
  };

  // 2 formes simples pour varier (croche / double-croche)
  if (variant % 2 === 0) {
    return (
      <svg {...baseProps}>
        <defs>
          <linearGradient id="noteFill" x1="10" y1="6" x2="54" y2="58" gradientUnits="userSpaceOnUse">
            <stop stopColor="rgba(217,70,239,0.95)" />
            <stop offset="0.55" stopColor="rgba(139,92,246,0.9)" />
            <stop offset="1" stopColor="rgba(59,130,246,0.55)" />
          </linearGradient>
          <linearGradient id="noteStroke" x1="16" y1="10" x2="50" y2="54" gradientUnits="userSpaceOnUse">
            <stop stopColor="rgba(255,255,255,0.55)" />
            <stop offset="1" stopColor="rgba(255,255,255,0.08)" />
          </linearGradient>
        </defs>

        {/* Tige */}
        <path
          d="M38 10v28.5"
          stroke="url(#noteStroke)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M36.6 11.2v27.8"
          stroke="url(#noteFill)"
          strokeWidth="6.2"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* Drapeau */}
        <path
          d="M38 12c9 2 12 9 10 14-2-5-6-7-10-7"
          stroke="url(#noteFill)"
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />
        <path
          d="M38 12c9 2 12 9 10 14-2-5-6-7-10-7"
          stroke="url(#noteStroke)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.65"
        />

        {/* Tête */}
        <ellipse cx="28" cy="44" rx="11.5" ry="8.5" fill="url(#noteFill)" opacity="0.92" />
        <ellipse cx="28" cy="44" rx="11.5" ry="8.5" stroke="url(#noteStroke)" strokeWidth="2" opacity="0.6" />

        {/* Highlight */}
        <path
          d="M22 41c2-3 8-4 12-1"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg {...baseProps}>
      <defs>
        <linearGradient id="noteFill2" x1="10" y1="6" x2="54" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(192,132,252,0.95)" />
          <stop offset="0.6" stopColor="rgba(139,92,246,0.9)" />
          <stop offset="1" stopColor="rgba(244,114,182,0.55)" />
        </linearGradient>
        <linearGradient id="noteStroke2" x1="16" y1="10" x2="50" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(255,255,255,0.55)" />
          <stop offset="1" stopColor="rgba(255,255,255,0.08)" />
        </linearGradient>
      </defs>

      {/* Tige */}
      <path d="M40 10v28.5" stroke="url(#noteStroke2)" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M38.6 11.2v27.8" stroke="url(#noteFill2)" strokeWidth="6.2" strokeLinecap="round" opacity="0.9" />

      {/* Double drapeau */}
      <path
        d="M40 12c9 2 12 9 10 14-2-5-6-7-10-7"
        stroke="url(#noteFill2)"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.95"
      />
      <path
        d="M40 20c9 2 12 9 10 14-2-5-6-7-10-7"
        stroke="url(#noteFill2)"
        strokeWidth="6.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      <path
        d="M40 12c9 2 12 9 10 14-2-5-6-7-10-7"
        stroke="url(#noteStroke2)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />

      {/* Tête */}
      <ellipse cx="30" cy="44" rx="11.5" ry="8.5" fill="url(#noteFill2)" opacity="0.92" />
      <ellipse cx="30" cy="44" rx="11.5" ry="8.5" stroke="url(#noteStroke2)" strokeWidth="2" opacity="0.6" />

      {/* Highlight */}
      <path d="M24 41c2-3 8-4 12-1" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

export const MusicNoteBackground = () => {
  const [notes, setNotes] = useState(() =>
    Array.from({ length: 18 }, (_, i) => {
      const speedBase = 0.22 + Math.random() * 0.38;
      const angle = Math.random() * Math.PI * 2;
      const size = Math.random() * 70 + 46;
      return {
        id: i,
        size,
        x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
        y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
        vx: Math.cos(angle) * speedBase,
        vy: Math.sin(angle) * speedBase,
        opacity: Math.random() * 0.12 + 0.06,
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 0.25,
        tilt: (Math.random() - 0.5) * 18,
        variant: i
      };
    })
  );

  const mouseRef = useRef({ x: null, y: null });
  const scrollDeltaRef = useRef(0);
  const lastScrollYRef = useRef(typeof window !== 'undefined' ? window.scrollY : 0);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleScroll = () => {
      if (typeof window === 'undefined') return;
      const currentY = window.scrollY;
      const delta = currentY - lastScrollYRef.current;
      scrollDeltaRef.current = delta;
      lastScrollYRef.current = currentY;
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  useEffect(() => {
    let lastTime = performance.now();

    const animate = (time) => {
      const dt = Math.min((time - lastTime) / 16.67, 2);
      lastTime = time;

      if (typeof window === 'undefined') {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const width = window.innerWidth;
      const height = window.innerHeight;
      const mouse = mouseRef.current;

      setNotes((prev) =>
        prev.map((note) => {
          let { x, y, vx, vy, rot } = note;

          // Répulsion curseur: plus "nerveuse" que les bulles mais douce
          if (mouse.x !== null && mouse.y !== null) {
            const dx = x - mouse.x;
            const dy = y - mouse.y;
            const distSq = dx * dx + dy * dy;
            const radius = 240;
            if (distSq < radius * radius && distSq > 1) {
              const dist = Math.sqrt(distSq);
              const force = 0.3 / dist;
              vx += (dx / dist) * force;
              vy += (dy / dist) * force;
            }
          }

          // Scroll: petit souffle vers le haut
          const scrollInfluence = scrollDeltaRef.current * 0.00065;
          vy -= scrollInfluence;

          const maxSpeed = 1.7;
          vx *= 0.988;
          vy *= 0.988;

          const speed = Math.sqrt(vx * vx + vy * vy);
          if (speed > maxSpeed) {
            vx = (vx / speed) * maxSpeed;
            vy = (vy / speed) * maxSpeed;
          }

          x += vx * dt * 16;
          y += vy * dt * 16;
          rot += note.rotSpeed * dt * 16;

          const radiusPx = note.size / 2;
          if (x - radiusPx < 0) {
            x = radiusPx;
            vx = Math.abs(vx) * 0.9;
          } else if (x + radiusPx > width) {
            x = width - radiusPx;
            vx = -Math.abs(vx) * 0.9;
          }

          if (y - radiusPx < 0) {
            y = radiusPx;
            vy = Math.abs(vy) * 0.9;
          } else if (y + radiusPx > height) {
            y = height - radiusPx;
            vy = -Math.abs(vy) * 0.9;
          }

          return { ...note, x, y, vx, vy, rot };
        })
      );

      scrollDeltaRef.current *= 0.9;
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {notes.map((note) => (
        <div
          key={note.id}
          className="absolute will-change-transform"
          style={{
            width: note.size,
            height: note.size,
            transform: `translate(${note.x - note.size / 2}px, ${note.y - note.size / 2}px) rotate(${note.rot}deg) perspective(800px) rotateX(${note.tilt}deg) rotateY(${note.tilt * 0.7}deg)`,
            opacity: note.opacity,
            filter:
              'drop-shadow(0 16px 22px rgba(88,28,135,0.24)) drop-shadow(0 0 18px rgba(168,85,247,0.18))'
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              transform: 'translateZ(0)',
              background: 'transparent'
            }}
          >
            <NoteSvg variant={note.variant} />
          </div>
        </div>
      ))}
    </div>
  );
};

export const MusicNoteBubbleBackground = () => {
  return (
    <>
      <BubbleBackground />
      <MusicNoteBackground />
    </>
  );
};

export const GlowOrb = ({ color = "cyan", size = 300, x = "50%", y = "50%", blur = 100 }) => {
  const colors = {
    cyan: "rgba(34, 211, 238, 0.15)",
    purple: "rgba(139, 92, 246, 0.12)",
    pink: "rgba(244, 114, 182, 0.1)"
  };

  return (
    <div
      className="absolute pointer-events-none animate-breathe"
      style={{
        width: size,
        height: size,
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        background: `radial-gradient(circle, ${colors[color] || colors.cyan} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`
      }}
    />
  );
};

export default BubbleCard;
