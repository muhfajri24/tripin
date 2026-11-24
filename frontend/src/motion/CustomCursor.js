import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useReducedMotion } from './useReducedMotion';

/**
 * Awwwards-style Dual-Layer Custom Cursor.
 * Inner dot + fluid outer trailing ring that expands on interactive elements.
 * Disabled on touch/mobile devices and reduced-motion.
 * Fully click-through (pointer-events: none).
 */
export function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(true);
  const prefersReduced = useReducedMotion();

  // Mouse coordinate values
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Outer ring spring physics (soft fluid trailing)
  const springConfig = { damping: 24, stiffness: 300, mass: 0.4 };
  const smoothX = useSpring(cursorX, springConfig);
  const smoothY = useSpring(cursorY, springConfig);

  useEffect(() => {
    // Check if pointer is fine (mouse) and not coarse (touch)
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      setIsTouchDevice(true);
      return;
    }
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

    if (!finePointer || coarsePointer || prefersReduced) {
      setIsTouchDevice(true);
      return;
    }

    setIsTouchDevice(false);

    const handleMouseMove = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!isVisible) setIsVisible(true);

      // Check if hovering an interactive element
      const target = e.target;
      if (!target) return;

      const interactive = target.closest(
        'a, button, [role="button"], input, select, textarea, .interactive-hover, .opt-card'
      );
      setIsHovered(!!interactive);
    };

    const handleMouseLeaveWindow = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeaveWindow);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeaveWindow);
    };
  }, [cursorX, cursorY, isVisible, prefersReduced]);

  if (isTouchDevice || prefersReduced || !isVisible) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[999999] overflow-hidden select-none">
      {/* Outer fluid trailing ring */}
      <motion.div
        className="pointer-events-none absolute -top-4 -left-4 rounded-full border border-teal/70"
        style={{
          x: smoothX,
          y: smoothY,
          width: 34,
          height: 34,
          backgroundColor: isHovered ? 'rgba(23, 107, 103, 0.12)' : 'transparent',
          borderColor: isHovered ? '#FF6B5E' : 'rgba(23, 107, 103, 0.45)',
        }}
        animate={{
          scale: isHovered ? 1.7 : 1,
        }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Inner precise dot */}
      <motion.div
        className="pointer-events-none absolute -top-1 -left-1 rounded-full bg-coral"
        style={{
          x: cursorX,
          y: cursorY,
          width: 8,
          height: 8,
        }}
        animate={{
          scale: isHovered ? 0.6 : 1,
          backgroundColor: isHovered ? '#176B67' : '#FF6B5E',
        }}
        transition={{ duration: 0.12 }}
      />
    </div>
  );
}

export default CustomCursor;
