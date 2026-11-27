import React from 'react';
import { MapPin, Star, Clock, Bookmark, BookmarkCheck } from 'lucide-react';
import { formatCurrency, getCategoryColor } from '../data/mockData';
import PlaceImage from './PlaceImage';

function DestinationCard({ destination, onSave, onClick, variant = 'default' }) {
  const {
    name, city, image, rating, reviews, duration,
    ticketPrice, category, tags, saved
  } = destination;

  if (variant === 'compact') {
    return (
      <div
        className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-soft hover:shadow-card card-hover cursor-pointer"
        onClick={onClick}
      >
        <PlaceImage
          src={image}
          alt={`${name} di ${city}`}
          className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
          iconSize={16}
        />
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-charcoal text-sm truncate">{name}</h4>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={11} className="text-charcoal-lighter" />
            <span className="text-xs text-charcoal-lighter truncate">{city}</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Star size={11} className="text-yellow-trip fill-yellow-trip" />
            <span className="text-xs font-medium text-charcoal">{rating}</span>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${getCategoryColor(category)}`}>
          {category}
        </span>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-hover card-hover cursor-pointer group"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        <PlaceImage
          src={image}
          alt={`${name} di ${city}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Category badge */}
        <span className={`absolute top-3 left-3 text-xs px-2.5 py-1 rounded-full font-semibold backdrop-blur-sm ${getCategoryColor(category)}`}>
          {category}
        </span>

        {/* Save button */}
        <button
          onClick={(e) => { e.stopPropagation(); onSave && onSave(destination.id); }}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm"
        >
          {saved
            ? <BookmarkCheck size={15} className="text-coral fill-coral" />
            : <Bookmark size={15} className="text-charcoal" />
          }
        </button>

        {/* Rating */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
          <Star size={12} className="text-yellow-trip fill-yellow-trip" />
          <span className="text-xs font-semibold text-charcoal">{rating}</span>
          <span className="text-xs text-charcoal-lighter">({(reviews / 1000).toFixed(1)}k)</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-charcoal text-base leading-tight">{name}</h3>
        <div className="flex items-center gap-1 mt-1">
          <MapPin size={12} className="text-teal flex-shrink-0" />
          <span className="text-xs text-charcoal-lighter">{city}</span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {tags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-xs bg-sky text-teal px-2 py-0.5 rounded-full font-medium">
              {tag}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1 text-xs text-charcoal-lighter">
            <Clock size={12} />
            <span>{duration}</span>
          </div>
          <div className="text-right">
            {ticketPrice > 0
              ? <span className="text-sm font-bold text-teal">{formatCurrency(ticketPrice)}</span>
              : <span className="text-sm font-bold text-teal">Free Entry</span>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

export default DestinationCard;

