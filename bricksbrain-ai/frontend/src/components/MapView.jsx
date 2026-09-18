import React, { useEffect, useRef, useState } from "react";

/**
 * Google Maps view for a property location.
 * If VITE_GOOGLE_MAPS_API_KEY is not set, falls back to a static styled placeholder
 * with an "Open in Google Maps" link so the app still works out-of-the-box.
 */
export default function MapView({ lat, lng, title = "Property Location", height = 300 }) {
  const mapRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey || apiKey === "your_google_maps_api_key_here") return;

    const initMap = () => {
      if (!window.google || !mapRef.current) return;
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat, lng },
        zoom: 14,
        disableDefaultUI: false,
      });
      new window.google.maps.Marker({ position: { lat, lng }, map, title });
      setLoaded(true);
    };

    if (window.google) {
      initMap();
    } else {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.onload = initMap;
      document.head.appendChild(script);
    }
  }, [lat, lng, apiKey, title]);

  if (!apiKey || apiKey === "your_google_maps_api_key_here") {
    return (
      <div
        style={{ height }}
        className="rounded-xl bg-gradient-to-br from-brand-50 to-gray-100 border border-dashed border-gray-300 flex flex-col items-center justify-center text-center p-6"
      >
        <p className="text-sm text-gray-600 font-medium mb-1">Google Maps preview unavailable</p>
        <p className="text-xs text-gray-400 mb-3">Add VITE_GOOGLE_MAPS_API_KEY in frontend/.env to enable the live map</p>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
          target="_blank" rel="noreferrer"
          className="text-brand-600 text-sm font-semibold hover:underline"
        >
          Open location in Google Maps ↗
        </a>
      </div>
    );
  }

  return <div ref={mapRef} style={{ height }} className="rounded-xl w-full" />;
}
