import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from './useReducedMotion';

/**
 * TRIPIN signature skeleton loader with warm cream to soft turquoise shimmer.
 * Avoids boring generic gray AI skeletons.
 */
export function TripinSkeleton({
  className = '',
  width,
  height,
  rounded = 'rounded-xl',
  style = {},
}) {
  const prefersReduced = useReducedMotion();

  return (
    <div
      className={`relative overflow-hidden ${rounded} ${className}`}
      style={{
        width,
        height,
        background: 'rgba(23, 107, 103, 0.07)',
        ...style,
      }}
    >
      {!prefersReduced && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            repeat: Infinity,
            duration: 1.6,
            ease: 'linear',
          }}
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(46, 196, 182, 0.16) 40%, rgba(255, 200, 87, 0.12) 60%, transparent 100%)',
          }}
        />
      )}
    </div>
  );
}

/**
 * High-fidelity Destination Card Skeleton
 */
export function DestinationCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-teal-50/50 p-4 shadow-soft space-y-3">
      {/* Image thumbnail skeleton */}
      <TripinSkeleton height="180px" rounded="rounded-xl" />

      {/* Badges */}
      <div className="flex gap-2">
        <TripinSkeleton width="70px" height="20px" rounded="rounded-full" />
        <TripinSkeleton width="90px" height="20px" rounded="rounded-full" />
      </div>

      {/* Title */}
      <TripinSkeleton width="75%" height="24px" rounded="rounded-lg" />

      {/* Description */}
      <div className="space-y-1.5 pt-1">
        <TripinSkeleton width="100%" height="14px" rounded="rounded" />
        <TripinSkeleton width="85%" height="14px" rounded="rounded" />
      </div>

      {/* Price & action footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <TripinSkeleton width="80px" height="18px" rounded="rounded" />
        <TripinSkeleton width="95px" height="32px" rounded="rounded-xl" />
      </div>
    </div>
  );
}

export default TripinSkeleton;
