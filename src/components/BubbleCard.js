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
