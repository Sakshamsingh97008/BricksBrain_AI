import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  TrendingUp,
  Brain,
  Box,
  MapPinned,
  Bot,
  ShieldCheck,
} from "lucide-react";

import api from "../api/axios";
import PropertyCard from "../components/PropertyCard";

// Background image
import bgImage from "../assets/dashboard-bg.jpg";

const FEATURES = [
  {
    icon: Brain,
    title: "Smart Price Estimate",
    desc: "Get a quick estimate of what a property is worth based on local market data.",
  },
  {
    icon: TrendingUp,
    title: "Future Price Trends",
    desc: "See how property prices may change in the coming years.",
  },
  {
    icon: MapPinned,
    title: "Explore the Neighborhood",
    desc: "Check nearby schools, hospitals, transport, safety, and other important facilities.",
  },
  {
    icon: Box,
    title: "View Property in 3D",
    desc: "Explore the property with an interactive 3D view before making a decision.",
  },
  {
    icon: Bot,
    title: "Ask About Properties",
    desc: "Get quick answers about properties, prices, EMIs, and nearby areas.",
  },
  {
    icon: ShieldCheck,
    title: "Trusted Properties",
    desc: "Find properties that have been checked before being listed.",
  },
];

export default function Home() {
  const [city, setCity] = useState("");
  const [listingType, setListingType] = useState("Sale");
  const [featured, setFeatured] = useState([]);

  const navigate = useNavigate();

  // =========================
  // GET FEATURED PROPERTIES
  // =========================
  useEffect(() => {
    api
      .get("/properties/featured")
      .then(({ data }) => {
        setFeatured(data.properties || []);
      })
      .catch((err) => {
        console.error("Error loading featured properties:", err);
      });
  }, []);

  // =========================
  // SEARCH
  // =========================
  const handleSearch = (e) => {
    e.preventDefault();

    const params = new URLSearchParams();

    if (city) {
      params.set("city", city);
    }

    if (listingType) {
      params.set("listingType", listingType);
    }

    navigate(`/listings?${params.toString()}`);
  };

  return (
    <div className="min-h-screen">

      {/* =====================================================
          HERO SECTION WITH BACKGROUND IMAGE
      ===================================================== */}
      <section
        className="relative bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${bgImage})`,
        }}
      >

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/55"></div>

        {/* Hero Content */}
        <div className="relative text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">

            {/* Heading */}
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight max-w-3xl">
              Find your next home with{" "}
              <span className="text-blue-300 underline decoration-white/40">
                AI-powered
              </span>{" "}
              intelligence
            </h1>

            {/* Description */}
            <p className="mt-5 text-white/85 max-w-xl text-base md:text-lg">
              Price prediction, future forecasts, area scores, and a 3D
              digital twin — all in one platform.
            </p>

            {/* =================================================
                SEARCH BOX
            ================================================= */}
            <form
              onSubmit={handleSearch}
              className="mt-8 bg-white rounded-xl shadow-2xl p-3 flex flex-col md:flex-row gap-2 max-w-3xl"
            >

              {/* Buy / Rent */}
              <div className="flex gap-2 bg-gray-100 rounded-lg p-1">

                {["Sale", "Rent"].map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setListingType(t)}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                      listingType === t
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {t === "Sale" ? "Buy" : "Rent"}
                  </button>
                ))}

              </div>

              {/* Search Input */}
              <div className="flex-1 flex items-center gap-2 px-3">

                <Search
                  size={18}
                  className="text-gray-400"
                />

                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Search by city — e.g. Bangalore, Mumbai, Pune..."
                  className="w-full py-2 outline-none text-sm text-gray-800"
                />

              </div>

              {/* Search Button */}
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                Search
              </button>

            </form>

            {/* =================================================
                POPULAR CITIES
            ================================================= */}
            <div className="mt-6 flex flex-wrap gap-2">

              {[
                "Bangalore",
                "Mumbai",
                "Delhi",
                "Pune",
                "Hyderabad",
                "Gurugram",
              ].map((c) => (

                <button
                  key={c}
                  onClick={() =>
                    navigate(`/listings?city=${c}`)
                  }
                  className="text-xs bg-white/15 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-full transition"
                >
                  {c}
                </button>

              ))}

            </div>

          </div>
        </div>
      </section>

      {/* =====================================================
          FEATURES
      ===================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900">
          Powered by real machine learning, not gimmicks
        </h2>

        <p className="text-center text-gray-500 mt-2 max-w-2xl mx-auto">
          Every tool on BricksBrain AI is backed by an actual trained model
          or algorithm running behind the scenes.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">

          {FEATURES.map((f, i) => {
            const Icon = f.icon;

            return (
              <div
                key={i}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition"
              >

                <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <Icon size={22} />
                </div>

                <h3 className="font-semibold text-gray-900 mb-1">
                  {f.title}
                </h3>

                <p className="text-sm text-gray-500">
                  {f.desc}
                </p>

              </div>
            );
          })}

        </div>

      </section>

      {/* =====================================================
          FEATURED PROPERTIES
      ===================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">

        <div className="flex items-center justify-between mb-6">

          <h2 className="text-2xl font-bold text-gray-900">
            Featured Properties
          </h2>

          <button
            onClick={() => navigate("/listings")}
            className="text-blue-600 font-semibold text-sm hover:underline"
          >
            View all →
          </button>

        </div>

        {featured.length === 0 ? (

          <p className="text-gray-400 text-sm">
            No featured properties yet — run the backend seed script
            (`npm run seed`) to populate demo data.
          </p>

        ) : (

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">

            {featured.map((p) => (
              <PropertyCard
                key={p._id}
                property={p}
              />
            ))}

          </div>

        )}

      </section>

    </div>
  );
}