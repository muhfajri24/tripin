import { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';
import { useReducedMotion } from './useReducedMotion';

/**
 * Global Smooth Scrolling wrapper with Lenis.
 * Gives 60fps momentum scroll.
 * Automatically disabled on reduced-motion or touch devices.
 */
export function SmoothScroll({ children }) {
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (typeof window === 'undefined' || prefersReduced) return;

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

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.5,
    });

    window.__lenis = lenis;

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      window.__lenis = null;
    };
  }, [prefersReduced]);

  return children || null;
}

export default SmoothScroll;
