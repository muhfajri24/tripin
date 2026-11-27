import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';

/**
 * Image component with lazy loading, descriptive alt text,
 * and a themed teal gradient + location icon fallback on load error.
 */
export default function PlaceImage({
  src,
  alt,
  className = 'w-full h-full object-cover',
  loading = 'lazy',
  iconSize = 24,
}) {
  const [failed, setFailed] = useState(!src);

  useEffect(() => {
    setFailed(!src);
  }, [src]);

  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt || 'Ilustrasi lokasi destinasi'}
        className={`bg-gradient-to-br from-[#0d2221] via-[#176B67] to-[#1e887f] flex flex-col items-center justify-center text-white/85 select-none ${className}`}
      >
        <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
          <MapPin size={iconSize} className="text-white" />
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || 'Foto destinasi wisata Indonesia'}
      loading={loading}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
