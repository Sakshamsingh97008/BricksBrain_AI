import React, { useEffect, useState } from "react";
import { ShieldCheck, Footprints, Signal, School, Hospital, TrendingUp } from "lucide-react";
import api from "../api/axios";

const CITIES = ["Bangalore", "Mumbai", "Delhi", "Pune", "Hyderabad", "Chennai", "Gurugram", "Noida"];

export default function AreaIntelligence() {
  const [city, setCity] = useState("Bangalore");
  const [localities, setLocalities] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get("/properties", { params: { city, limit: 50 } })
      .then(({ data }) => {
        const map = new Map();
        data.properties.forEach((p) => {
          if (!map.has(p.locality)) map.set(p.locality, { locality: p.locality, ...p.areaIntelligence, count: 1, avgPrice: p.price });
          else {
            const e = map.get(p.locality);
            e.count += 1;
            e.avgPrice = (e.avgPrice * (e.count - 1) + p.price) / e.count;
          }
        });
        setLocalities([...map.values()]);
      })
      .finally(() => setLoading(false));
  }, [city]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-ink mb-1">Area Intelligence</h1>
      <p className="text-sm text-gray-500 mb-6">Explore livability, safety, connectivity, and growth scores by locality.</p>

      <div className="flex gap-2 flex-wrap mb-8">
        {CITIES.map((c) => (
          <button key={c} onClick={() => setCity(c)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${city === c ? "bg-brand-600 text-white border-brand-600" : "border-gray-300 text-gray-600"}`}>
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400">Loading area data...</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {localities.map((l, i) => (
            <div key={i} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-ink">{l.locality}</h3>
                <span className="text-xs text-gray-400">{l.count} listings</span>
              </div>
              <div className="space-y-2 text-sm">
                <ScoreRow icon={Footprints} label="Walk Score" value={l.walkScore} />
                <ScoreRow icon={ShieldCheck} label="Safety Score" value={l.safetyScore} />
                <ScoreRow icon={Signal} label="Connectivity" value={l.connectivityScore} />
                <div className="flex items-center justify-between text-gray-600">
                  <span className="flex items-center gap-1.5"><School size={14}/> Schools nearby</span>
                  <span className="font-medium">{l.nearbySchools}</span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span className="flex items-center gap-1.5"><Hospital size={14}/> Hospitals nearby</span>
                  <span className="font-medium">{l.nearbyHospitals}</span>
                </div>
                <div className="flex items-center justify-between text-brand-600 font-semibold pt-2 border-t border-gray-100">
                  <span className="flex items-center gap-1.5"><TrendingUp size={14}/> 5yr Growth</span>
                  <span>{Math.round(l.priceGrowth5yr)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScoreRow({ icon: Icon, label, value }) {
  return (
    <div>
      <div className="flex items-center justify-between text-gray-600 mb-1">
        <span className="flex items-center gap-1.5"><Icon size={14}/> {label}</span>
        <span className="font-medium">{Math.round(value)}/100</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-brand-600 rounded-full" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
