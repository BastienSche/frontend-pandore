import React from 'react';
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
  const bubbles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    size: Math.random() * 150 + 50,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 5,
    duration: Math.random() * 8 + 6,
    opacity: Math.random() * 0.08 + 0.02
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {bubbles.map((bubble) => (
        <motion.div
          key={bubble.id}
          className="absolute rounded-full"
          style={{
            width: bubble.size,
            height: bubble.size,
            left: `${bubble.x}%`,
            top: `${bubble.y}%`,
            background: `radial-gradient(circle at 30% 30%, rgba(34, 211, 238, ${bubble.opacity}), transparent 70%)`,
            border: `1px solid rgba(255, 255, 255, ${bubble.opacity / 2})`
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: bubble.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: bubble.delay
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
