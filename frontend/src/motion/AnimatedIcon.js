import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from './useReducedMotion';

/**
 * Animated Icon wrapper for Lucide icons.
 * Provides micro-animations on hover, active, or continuous pulse.
 * Modes: 'bounce' (default), 'rotate', 'pulse', 'wiggle', 'scale'
 */
export function AnimatedIcon({
  icon: Icon,
  size = 20,
  className = '',
  animation = 'bounce',
  active = false,
  color,
  ...props
}) {
  const prefersReduced = useReducedMotion();

  if (!Icon) return null;

  if (prefersReduced) {
    return <Icon size={size} className={className} color={color} {...props} />;
  }

  const getAnimationVariants = () => {
    switch (animation) {
      case 'rotate':
        return {
          rest: { rotate: 0 },
          hover: { rotate: 22, transition: { type: 'spring', stiffness: 350, damping: 15 } },
          active: { rotate: 360, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
        };
      case 'wiggle':
        return {
          rest: { rotate: 0 },
          hover: {
            rotate: [0, -12, 10, -6, 4, 0],
            transition: { duration: 0.5, ease: 'easeInOut' },
          },
          active: { scale: 1.15 },
        };
      case 'pulse':
        return {
          rest: { scale: 1 },
          hover: {
            scale: [1, 1.2, 1],
            transition: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' },
          },
          active: { scale: 1.15 },
        };
      case 'scale':
        return {
          rest: { scale: 1 },
          hover: { scale: 1.2, transition: { type: 'spring', stiffness: 400, damping: 17 } },
          active: { scale: 0.95 },
        };
      case 'bounce':
      default:
        return {
          rest: { scale: 1, y: 0, rotate: 0 },
          hover: {
            scale: 1.18,
            y: -2,
            rotate: 4,
            transition: { type: 'spring', stiffness: 400, damping: 12 },
          },
          active: { scale: 0.92, y: 0 },
        };
    }
  };

  return (
    <motion.span
      className={`inline-flex items-center justify-center will-change-transform ${className}`}
      initial="rest"
      whileHover="hover"
      whileTap="active"
      animate={active ? 'active' : 'rest'}
      variants={getAnimationVariants()}
    >
      <Icon size={size} color={color} {...props} />
    </motion.span>
  );
}

export default AnimatedIcon;
