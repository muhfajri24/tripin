import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from './useReducedMotion';

/**
 * Reusable scroll-triggered reveal animation component.
 * Supports:
 * - variant: 'fade-up' (default), 'fade', 'scale-up', 'slide-left', 'slide-right'
 * - delay: in seconds (e.g. 0.1, 0.2)
 * - duration: in seconds (default 0.45s)
 * - staggerChildren: for container with multiple animated items
 */
export function RevealOnScroll({
  children,
  variant = 'fade-up',
  delay = 0,
  duration = 0.45,
  className = '',
  viewportMargin = '-40px',
  once = true,
  ...props
}) {
  const prefersReduced = useReducedMotion();
  const hasIntersectionObserver =
    typeof window !== 'undefined' && typeof window.IntersectionObserver !== 'undefined';

  if (prefersReduced || !hasIntersectionObserver) {
    return <div className={className} {...props}>{children}</div>;
  }

  const getVariants = () => {
    switch (variant) {
      case 'fade':
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
        };
      case 'scale-up':
        return {
          hidden: { opacity: 0, scale: 0.94 },
          visible: { opacity: 1, scale: 1 },
        };
      case 'slide-left':
        return {
          hidden: { opacity: 0, x: -24 },
          visible: { opacity: 1, x: 0 },
        };
      case 'slide-right':
        return {
          hidden: { opacity: 0, x: 24 },
          visible: { opacity: 1, x: 0 },
        };
      case 'fade-up':
      default:
        return {
          hidden: { opacity: 0, y: 22 },
          visible: { opacity: 1, y: 0 },
        };
    }
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: viewportMargin }}
      variants={getVariants()}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger container for a grid of items
 */
export function StaggerContainer({
  children,
  staggerDelay = 0.08,
  delayChildren = 0.1,
  className = '',
  ...props
}) {
  const prefersReduced = useReducedMotion();
  const hasIntersectionObserver =
    typeof window !== 'undefined' && typeof window.IntersectionObserver !== 'undefined';

  if (prefersReduced || !hasIntersectionObserver) {
    return <div className={className} {...props}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren,
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export default RevealOnScroll;
