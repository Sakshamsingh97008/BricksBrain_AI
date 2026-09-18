import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import api from "../api/axios";
import PropertyCard from "../components/PropertyCard";
import { useAuth } from "../context/AuthContext";

const CITIES = ["Bangalore", "Mumbai", "Delhi", "Pune", "Hyderabad", "Chennai", "Gurugram", "Noida"];
const TYPES = ["Apartment", "Villa", "Independent House", "Plot", "Commercial", "Studio"];

export default function Listings() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [compareList, setCompareList] = useState([]);
  const [savedIds, setSavedIds] = useState([]);

  const [filters, setFilters] = useState({
    city: params.get("city") || "",
    listingType: params.get("listingType") || "",
    propertyType: params.get("propertyType") || "",
    bhk: params.get("bhk") || "",
    minPrice: params.get("minPrice") || "",
    maxPrice: params.get("maxPrice") || "",
    sort: params.get("sort") || "newest",
  });

  const fetchProperties = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const query = { ...filters, page: p, limit: 12 };
      Object.keys(query).forEach((k) => (query[k] === "" ? delete query[k] : null));
      const { data } = await api.get("/properties", { params: query });
      setProperties(data.properties);
      setTotal(data.total);
      setPage(data.page);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchProperties(1); }, [fetchProperties]);

  const applyFilters = (e) => {
    e?.preventDefault?.();
    const query = new URLSearchParams(filters);
    setParams(query);
    fetchProperties(1);
  };

  const toggleCompare = (id) => {
    setCompareList((list) => {
      if (list.includes(id)) return list.filter((x) => x !== id);
      if (list.length >= 4) return list;
      return [...list, id];
    });
  };

  const toggleSave = async (id) => {
    if (!user) return navigate("/login");
    try {
      const { data } = await api.post(`/properties/${id}/save`);
      setSavedIds(data.savedProperties);
    } catch (err) {}
  };

  const goCompare = () => {
    navigate(`/compare?ids=${compareList.join(",")}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters sidebar */}
        <aside className="md:w-64 flex-shrink-0">
          <form onSubmit={applyFilters} className="card p-5 space-y-4 sticky top-20">
            <h3 className="font-semibold flex items-center gap-2"><SlidersHorizontal size={16}/> Filters</h3>

            <div>
              <label className="text-xs font-medium text-gray-500">City</label>
              <select className="input-field mt-1" value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })}>
                <option value="">All Cities</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500">Listing Type</label>
              <select className="input-field mt-1" value={filters.listingType} onChange={(e) => setFilters({ ...filters, listingType: e.target.value })}>
                <option value="">Buy or Rent</option>
                <option value="Sale">Buy</option>
                <option value="Rent">Rent</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500">Property Type</label>
              <select className="input-field mt-1" value={filters.propertyType} onChange={(e) => setFilters({ ...filters, propertyType: e.target.value })}>
                <option value="">Any Type</option>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500">BHK</label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((b) => (
                  <button type="button" key={b}
                    onClick={() => setFilters({ ...filters, bhk: filters.bhk === String(b) ? "" : String(b) })}
                    className={`w-9 h-9 rounded-lg text-xs font-semibold border ${filters.bhk === String(b) ? "bg-brand-600 text-white border-brand-600" : "border-gray-300 text-gray-600"}`}>
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-500">Min Price</label>
                <input type="number" className="input-field mt-1" value={filters.minPrice} onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Max Price</label>
                <input type="number" className="input-field mt-1" value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500">Sort By</label>
              <select className="input-field mt-1" value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="area_desc">Largest Area</option>
              </select>
            </div>

            <button type="submit" className="btn-primary w-full">Apply Filters</button>
          </form>
        </aside>

        {/* Results */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{total} properties found</p>
            <div className="flex items-center gap-3">
              {compareList.length > 0 && <span className="text-xs text-gray-500">{compareList.length}/4 selected</span>}
              {compareList.length >= 2 && (
                <button onClick={goCompare} className="btn-outline !py-1.5 !px-3 text-xs">
                  Compare {compareList.length} selected →
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <div key={i} className="h-72 bg-gray-100 animate-pulse rounded-xl" />)}
            </div>
          ) : properties.length === 0 ? (
            <p className="text-gray-400 text-center py-20">No properties match your filters. Try widening your search, or run the backend seed script.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((p) => (
                <PropertyCard
                  key={p._id} property={p}
                  onCompare={toggleCompare} isComparing={compareList.includes(p._id)}
                  onSave={toggleSave} isSaved={savedIds.includes(p._id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
