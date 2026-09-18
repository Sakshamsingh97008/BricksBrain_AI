import React from "react";
import { formatPrice } from "./PropertyCard";
import { getImageUrl } from "../utils/imageUrl";

const ROWS = [
  { label: "Price", key: (p) => formatPrice(p.price) },
  { label: "Type", key: (p) => p.propertyType },
  { label: "BHK", key: (p) => p.bhk },
  { label: "Bathrooms", key: (p) => p.bathrooms },
  { label: "Area", key: (p) => `${p.areaSqft} sqft` },
  { label: "Price / sqft", key: (p) => `₹${Math.round(p.price / p.areaSqft).toLocaleString("en-IN")}` },
  { label: "Furnishing", key: (p) => p.furnishing },
  { label: "Floor", key: (p) => `${p.floor} / ${p.totalFloors}` },
  { label: "Age", key: (p) => `${p.ageOfProperty} yrs` },
  { label: "Facing", key: (p) => p.facing },
  { label: "Locality", key: (p) => `${p.locality}, ${p.city}` },
  { label: "Walk Score", key: (p) => p.areaIntelligence?.walkScore },
  { label: "Safety Score", key: (p) => p.areaIntelligence?.safetyScore },
  { label: "Connectivity", key: (p) => p.areaIntelligence?.connectivityScore },
  { label: "5yr Price Growth", key: (p) => `${p.areaIntelligence?.priceGrowth5yr}%` },
  { label: "Amenities", key: (p) => (p.amenities || []).join(", ") },
];

export default function CompareTable({ properties }) {
  if (!properties || properties.length < 2) {
    return <p className="text-gray-500 text-center py-10">Select at least 2 properties to compare.</p>;
  }

  return (
    <div className="overflow-x-auto card">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left p-3 font-semibold text-gray-600 w-40">Feature</th>
            {properties.map((p) => (
              <th key={p._id} className="text-left p-3 min-w-[200px]">
                <img src={getImageUrl(p.images?.[0])} className="w-full h-24 object-cover rounded-lg mb-2" alt={p.title} />
                <p className="font-semibold text-ink line-clamp-2">{p.title}</p>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <td className="p-3 font-medium text-gray-600">{row.label}</td>
              {properties.map((p) => (
                <td key={p._id} className="p-3 text-gray-800">{row.key(p) ?? "-"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
