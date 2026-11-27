import React from 'react';
import { TrendingUp, Star } from 'lucide-react';
import PlaceImage from './PlaceImage';

function RecommendationCard({ rec, onClick }) {
  const { destination, tagline, image, rating, avgBudget, duration, tags, trendingScore } = rec;
  return (
    <div
      className="relative rounded-2xl overflow-hidden h-52 cursor-pointer group card-hover"
      onClick={onClick}
    >
      <PlaceImage
        src={image}
        alt={`${destination} — ${tagline || 'Destinasi rekomendasi Indonesia'}`}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Trending badge */}
      {trendingScore >= 90 && (
        <div className="absolute top-3 left-3 flex items-center gap-1 bg-coral text-white text-xs px-2.5 py-1 rounded-full font-semibold">
          <TrendingUp size={11} />
          Trending
        </div>
      )}

      {/* Rating */}
      <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
        <Star size={10} className="fill-yellow-trip text-yellow-trip" />
        <span>{rating}</span>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white font-bold text-base leading-tight">{destination}</h3>
        <p className="text-white/70 text-xs mt-0.5">{tagline}</p>
        <div className="flex items-center justify-between mt-2">
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                {tag}
              </span>
            ))}
          </div>
          <div className="text-right">
            <p className="text-white text-xs opacity-70">{duration}</p>
            <p className="text-yellow-trip text-xs font-semibold">~{avgBudget}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecommendationCard;

