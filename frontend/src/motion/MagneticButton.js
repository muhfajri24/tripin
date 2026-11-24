import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useReducedMotion } from './useReducedMotion';

/**
 * Magnetic Button component that subtly attracts toward pointer on hover.
 * Spring physics give a satisfying tactile micro-interaction.
 * Automatically falls back to standard button on touch/mobile or reduced-motion.
 */
export function MagneticButton({
  children,
  className = '',
  pullStrength = 0.25,
  onClick,
  disabled = false,
  as = 'button',
  ...props
}) {
  const buttonRef = useRef(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasCoarse =
        typeof window.matchMedia === 'function'
          ? window.matchMedia('(pointer: coarse)').matches
          : false;
      setIsTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        hasCoarse
      );
    }
  }, []);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 14, stiffness: 220, mass: 0.2 };
  const smoothX = useSpring(x, springConfig);
  const smoothY = useSpring(y, springConfig);

  const handleMouseMove = (e) => {
    if (isTouchDevice || prefersReduced || disabled || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;

    x.set(distanceX * pullStrength);
    y.set(distanceY * pullStrength);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const Component = motion[as] || motion.button;

  if (isTouchDevice || prefersReduced) {
    const RawComponent = as === 'button' ? 'button' : as;
    return (
      <RawComponent
        ref={buttonRef}
        onClick={onClick}
        disabled={disabled}
        className={`transition-transform duration-150 active:scale-95 ${className}`}
        {...props}
      >
        {children}
      </RawComponent>
    );
  }

  return (
    <Component
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      disabled={disabled}
      style={{
        x: smoothX,
        y: smoothY,
      }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.95 }}
      transition={{ scale: { duration: 0.15, ease: [0.22, 1, 0.36, 1] } }}
      className={`relative inline-flex items-center justify-center will-change-transform ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

export default MagneticButton;
