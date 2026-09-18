import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../api/axios";
import CompareTable from "../components/CompareTable";

export default function Compare() {
  const [params] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const ids = params.get("ids");
    if (!ids) return;
    setLoading(true);
    setError("");
    api.post("/properties/compare", { ids: ids.split(",") })
      .then(({ data }) => setProperties(data.properties))
      .catch((err) => {
        setProperties([]);
        setError(err.response?.data?.message || "Could not load the selected properties.");
      })
      .finally(() => setLoading(false));
  }, [params]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-ink mb-1">Compare Properties</h1>
      <p className="text-sm text-gray-500 mb-6">
        Side-by-side comparison of price, area, amenities, and area intelligence scores.{" "}
        {properties.length === 0 && (
          <>Go to <Link to="/listings" className="text-brand-600 font-semibold hover:underline">Listings</Link> and select the "Compare" button on 2-4 properties.</>
        )}
      </p>
      {loading ? <p className="text-gray-400">Loading comparison...</p> : error ? <p className="text-red-500">{error}</p> : <CompareTable properties={properties} />}
    </div>
  );
}
