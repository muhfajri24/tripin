import React, { useEffect } from 'react';
import { useReducedMotion } from './useReducedMotion';

/**
 * Global Smooth Scrolling wrapper with Lenis.
 * Gives 60fps momentum scroll.
 * Safe fallback: if Lenis, ResizeObserver, or window is unavailable or fails,
 * native smooth scrolling is preserved and page NEVER crashes.
 */
export function SmoothScroll({ children }) {
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof ResizeObserver === 'undefined' ||
      prefersReduced
    ) {
      return;
    }

    // Check if touch device
    const hasCoarse =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(pointer: coarse)').matches
        : false;
    const isTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      hasCoarse;

    if (isTouch) return;

    let lenis = null;
    let rafId = null;

    try {
      // Dynamic import / safe initialization
      const Lenis = require('@studio-freight/lenis');
      const LenisClass = Lenis.default || Lenis;

      if (typeof LenisClass === 'function') {
        lenis = new LenisClass({
          duration: 1.1,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          wheelMultiplier: 0.9,
          touchMultiplier: 1.5,
        });

        window.__lenis = lenis;

        const raf = (time) => {
          lenis.raf(time);
          rafId = requestAnimationFrame(raf);
        };

        rafId = requestAnimationFrame(raf);
      }
    } catch (e) {
      // Graceful fallback to native scroll
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (lenis) {
        try {
          lenis.destroy();
        } catch (e) {}
      }
      window.__lenis = null;
    };
  }, [prefersReduced]);

  return <>{children}</>;
}

export default SmoothScroll;
