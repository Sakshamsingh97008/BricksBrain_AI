import React from "react";
import { Link } from "react-router-dom";
import { MapPin, BedDouble, Bath, Ruler, Heart, GitCompare } from "lucide-react";
import { getPropertyImage } from "../utils/imageUrl";

function formatPrice(price) {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(2)} Lakh`;
  return `₹${price.toLocaleString("en-IN")}`;
}

export default function PropertyCard({ property, onSave, onCompare, isSaved, isComparing }) {
  return (
    <div className="card overflow-hidden group">
      <div className="relative">
        <Link to={`/property/${property._id}`}>
          <img
            src={getPropertyImage(property)}
            alt={property.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>
        <span className="absolute top-3 left-3 bg-brand-600 text-white text-xs font-semibold px-2 py-1 rounded">
          For {property.listingType}
        </span>
        <button
          onClick={() => onSave && onSave(property._id)}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center bg-white/90 hover:bg-white shadow ${isSaved ? "text-brand-600" : "text-gray-500"}`}
        >
          <Heart size={16} fill={isSaved ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="p-4">
        <p className="text-lg font-bold text-ink">{formatPrice(property.price)}</p>
        <Link to={`/property/${property._id}`}>
          <h3 className="text-sm font-semibold text-gray-800 line-clamp-1 mt-1 hover:text-brand-600">{property.title}</h3>
        </Link>
        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
          <MapPin size={12} /> {property.locality}, {property.city}
        </p>

        <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
          <span className="flex items-center gap-1"><BedDouble size={14} /> {property.bhk} BHK</span>
          <span className="flex items-center gap-1"><Bath size={14} /> {property.bathrooms} Bath</span>
          <span className="flex items-center gap-1"><Ruler size={14} /> {property.areaSqft} sqft</span>
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <Link to={`/property/${property._id}`} className="text-brand-600 text-sm font-semibold hover:underline">
            View Details
          </Link>
          {onCompare && (
            <button
              onClick={() => onCompare(property._id)}
              className={`text-xs flex items-center gap-1 px-2 py-1 rounded border ${isComparing ? "border-brand-600 text-brand-600 bg-brand-50" : "border-gray-300 text-gray-500"}`}
            >
              <GitCompare size={12} /> Compare
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export { formatPrice };
