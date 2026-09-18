import React, { useMemo, useState } from "react";
import { BrickWall, Calculator, CircleDollarSign } from "lucide-react";

const QUALITY_RATES = {
  Basic: 1650,
  Standard: 2100,
  Premium: 2850,
};

const MATERIAL_FACTORS = {
  cement: { label: "Cement", unit: "bags", factor: 0.4, decimals: 0 },
  steel: { label: "Steel", unit: "kg", factor: 4, decimals: 0 },
  sand: { label: "Sand", unit: "cu ft", factor: 1.5, decimals: 0 },
  aggregate: { label: "Aggregate", unit: "cu ft", factor: 1.2, decimals: 0 },
  bricks: { label: "Bricks", unit: " nos", factor: 8, decimals: 0 },
};

export default function ConstructionCost({ areaSqft, propertyType }) {
  const [quality, setQuality] = useState("Standard");

  const estimate = useMemo(() => {
    const area = Number(areaSqft) || 0;
    const rate = propertyType === "Villa" ? QUALITY_RATES[quality] + 250 : QUALITY_RATES[quality];
    const materials = Object.fromEntries(
      Object.entries(MATERIAL_FACTORS).map(([key, material]) => [
        key,
        Math.round(area * material.factor).toLocaleString("en-IN"),
      ])
    );

    return { rate, total: area * rate, materials };
  }, [areaSqft, propertyType, quality]);

  return (
    <section className="card p-5">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <BrickWall size={18} className="text-brand-600" /> Construction Cost & Materials
          </h2>
          <p className="text-xs text-gray-500 mt-1">Approximate estimate for {Number(areaSqft).toLocaleString("en-IN")} sqft of built-up area.</p>
        </div>
        <Calculator size={18} className="text-gray-400 shrink-0" />
      </div>

      <div className="flex flex-wrap gap-2 mb-5" role="group" aria-label="Construction quality">
        {Object.keys(QUALITY_RATES).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setQuality(option)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              quality === option
                ? "bg-brand-600 border-brand-600 text-white"
                : "border-gray-200 text-gray-600 hover:border-brand-600 hover:text-brand-600"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-5">
        <div className="bg-brand-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 flex items-center gap-1"><CircleDollarSign size={13} /> Estimated construction cost</p>
          <p className="text-xl font-bold text-brand-700 mt-1">₹{Math.round(estimate.total).toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Rate used</p>
          <p className="text-xl font-bold text-ink mt-1">₹{estimate.rate.toLocaleString("en-IN")}<span className="text-xs font-medium text-gray-500"> / sqft</span></p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(MATERIAL_FACTORS).map(([key, material]) => (
          <div key={key} className="border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-500">{material.label}</p>
            <p className="font-bold text-ink mt-1">{estimate.materials[key]}</p>
            <p className="text-[11px] text-gray-400">{material.unit}</p>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-gray-400 mt-4">Indicative quantities include structure and standard wastage. Actual rates and quantities vary by design, soil, location, and contractor.</p>
    </section>
  );
}