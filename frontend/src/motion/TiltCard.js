import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useReducedMotion } from './useReducedMotion';

/**
 * 3D Tilt Card with dynamic specular glare reflection following cursor.
 * Inspired by Awwwards interactive card physics.
 * Automatically falls back to gentle 2D hover on mobile / touch or reduced-motion.
 */
export function TiltCard({
  children,
  className = '',
  maxTilt = 8,
  glare = true,
  onClick,
  style = {},
  ...props
}) {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
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

  // Motion values for normalized cursor coordinates (-0.5 to 0.5)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for rotation
  const springConfig = { damping: 20, stiffness: 200, mass: 0.5 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  // Invert Y for correct tilt perspective (cursor up = tilt forward)
  const rotateX = useTransform(smoothMouseY, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateY = useTransform(smoothMouseX, [-0.5, 0.5], [-maxTilt, maxTilt]);

  // Specular reflection position percentages
  const glareX = useTransform(smoothMouseX, [-0.5, 0.5], [0, 100]);
  const glareY = useTransform(smoothMouseY, [-0.5, 0.5], [0, 100]);

  const handleMouseMove = (e) => {
    if (isTouchDevice || prefersReduced || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseEnter = () => {
    if (!isTouchDevice && !prefersReduced) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  if (isTouchDevice || prefersReduced) {
    return (
      <div
        ref={cardRef}
        onClick={onClick}
        className={`rounded-2xl transition-transform duration-200 active:scale-[0.98] ${className}`}
        style={style}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <div style={{ perspective: 1000 }} className="relative">
      <motion.div
        ref={cardRef}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          ...style,
        }}
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.985 }}
        transition={{ scale: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
        className={`relative overflow-hidden rounded-2xl will-change-transform ${className}`}
        {...props}
      >
        {children}

        {/* Dynamic Specular Glare Overlay */}
        {glare && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
            style={{
              opacity: isHovered ? 0.35 : 0,
              background: `radial-gradient(circle 260px at ${glareX.get()}% ${glareY.get()}%, rgba(255, 255, 255, 0.7), transparent 70%)`,
            }}
          />
        )}
      </motion.div>
    </div>
  );
}

export default TiltCard;
