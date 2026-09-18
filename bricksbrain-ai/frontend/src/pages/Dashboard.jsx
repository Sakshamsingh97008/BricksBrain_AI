import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Sparkles, Settings, Building2, PlusCircle } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import PropertyCard from "../components/PropertyCard";
import bgImage from "../assets/dashboard-bg.jpg";

const STATUS_STYLES = {
  Active: "bg-green-100 text-green-700",
  Pending: "bg-amber-100 text-amber-700",
  Sold: "bg-gray-200 text-gray-600",
  Rented: "bg-gray-200 text-gray-600",
  Inactive: "bg-gray-200 text-gray-600",
  Rejected: "bg-red-100 text-red-600",
};

export default function Dashboard() {
  const { user, setUser } = useAuth();

  const [tab, setTab] = useState("saved");
  const [saved, setSaved] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRec, setLoadingRec] = useState(false);
  const [myListings, setMyListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [prefs, setPrefs] = useState(user?.preferences || {});

  // =========================
  // GET USER DATA
  // =========================
  useEffect(() => {
    const getUserData = async () => {
      try {
        const { data } = await api.get("/auth/me");

        setSaved(data.user?.savedProperties || []);
        setPrefs(data.user?.preferences || {});
      } catch (err) {
        console.error("Error loading user data:", err);
      }
    };

    getUserData();
  }, []);

  // =========================
  // LOAD AI RECOMMENDATIONS
  // =========================
  const loadRecommendations = async () => {
    setLoadingRec(true);

    try {
      const { data } = await api.get("/properties/recommendations");

      setRecommendations(data.properties || []);
    } catch (err) {
      console.error("Error loading recommendations:", err);
      setRecommendations([]);
    } finally {
      setLoadingRec(false);
    }
  };

  // Load recommendations when tab is selected
  useEffect(() => {
    if (tab === "recommendations") {
      loadRecommendations();
    }
  }, [tab]);

  // =========================
  // LOAD MY LISTINGS
  // =========================
  const loadMyListings = async () => {
    setLoadingListings(true);
    try {
      const { data } = await api.get("/properties/my-listings");
      setMyListings(data.properties || []);
    } catch (err) {
      console.error("Error loading my listings:", err);
      setMyListings([]);
    } finally {
      setLoadingListings(false);
    }
  };

  useEffect(() => {
    if (tab === "listings") {
      loadMyListings();
    }
  }, [tab]);

  // =========================
  // SAVE PREFERENCES
  // =========================
  const savePrefs = async () => {
    try {
      const { data } = await api.put("/auth/me", {
        preferences: prefs,
      });

      setUser(data.user);

      alert("Preferences saved successfully!");
    } catch (err) {
      console.error("Error saving preferences:", err);
      alert("Failed to save preferences");
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{
        backgroundImage: `url(${bgImage})`,
      }}
    >
      {/* Background overlay */}
      <div className="min-h-screen bg-white/70">

        {/* Main container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* =========================
              HEADER
          ========================= */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Hi, {user?.name?.split(" ")[0] || "User"} 👋
            </h1>

            <p className="text-gray-600 text-sm mt-1">
              Manage your saved properties, preferences, and AI
              recommendations.
            </p>
          </div>

          {/* =========================
              TABS
          ========================= */}
          <div className="flex gap-2 mb-6 border-b border-gray-300">

            {[
              {
                id: "saved",
                label: "Saved Properties",
                icon: Heart,
              },
              {
                id: "listings",
                label: "My Listings",
                icon: Building2,
              },
              {
                id: "recommendations",
                label: "AI Recommendations",
                icon: Sparkles,
              },
              {
                id: "preferences",
                label: "Preferences",
                icon: Settings,
              },
            ].map((t) => {
              const Icon = t.icon;

              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 -mb-px transition ${
                    tab === t.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-blue-600"
                  }`}
                >
                  <Icon size={16} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* =========================
              SAVED PROPERTIES
          ========================= */}
          {tab === "saved" && (
            <div>
              {saved.length === 0 ? (
                <div className="bg-white/90 rounded-xl p-8 text-center shadow-sm">
                  <Heart
                    size={40}
                    className="mx-auto mb-3 text-gray-300"
                  />

                  <p className="text-gray-500 text-sm">
                    No saved properties yet.
                  </p>

                  <p className="text-gray-400 text-xs mt-1">
                    Browse listings and tap the heart icon to save.
                  </p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {saved.map((property) => (
                    <PropertyCard
                      key={property._id}
                      property={property}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =========================
              MY LISTINGS
          ========================= */}
          {tab === "listings" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">Properties you've posted, and their review status.</p>
                <Link to="/list-property" className="btn-primary !py-2 !px-4 text-sm inline-flex items-center gap-1.5">
                  <PlusCircle size={15} /> Post a Property
                </Link>
              </div>

              {loadingListings ? (
                <div className="bg-white/90 rounded-xl p-8 text-center">
                  <Building2 size={35} className="mx-auto mb-3 text-blue-500" />
                  <p className="text-gray-500 text-sm">Loading your listings...</p>
                </div>
              ) : myListings.length === 0 ? (
                <div className="bg-white/90 rounded-xl p-8 text-center shadow-sm">
                  <Building2 size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 text-sm">You haven't posted any properties yet.</p>
                  <Link to="/list-property" className="text-brand-600 text-sm font-semibold hover:underline mt-2 inline-block">
                    Post your first property →
                  </Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myListings.map((property) => (
                    <div key={property._id} className="relative">
                      <span className={`absolute top-3 right-3 z-10 text-[11px] font-semibold px-2 py-1 rounded-full ${STATUS_STYLES[property.status] || "bg-gray-200 text-gray-600"}`}>
                        {property.status}
                      </span>
                      <PropertyCard property={property} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =========================
              AI RECOMMENDATIONS
          ========================= */}
          {tab === "recommendations" && (
            <div>

              <div className="bg-white/80 rounded-lg p-4 mb-5">
                <p className="text-sm text-gray-600">
                  ✨ Personalized picks based on your preferences,
                  browsing history, and saved properties.
                </p>
              </div>

              {loadingRec ? (
                <div className="bg-white/90 rounded-xl p-8 text-center">
                  <Sparkles
                    size={35}
                    className="mx-auto mb-3 text-blue-500"
                  />

                  <p className="text-gray-500 text-sm">
                    Loading AI recommendations...
                  </p>
                </div>
              ) : recommendations.length === 0 ? (
                <div className="bg-white/90 rounded-xl p-8 text-center">
                  <Sparkles
                    size={40}
                    className="mx-auto mb-3 text-gray-300"
                  />

                  <p className="text-gray-500 text-sm">
                    No recommendations yet.
                  </p>

                  <p className="text-gray-400 text-xs mt-1">
                    Save a few properties or set your preferences
                    to improve results.
                  </p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendations.map((property) => (
                    <PropertyCard
                      key={property._id}
                      property={property}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =========================
              PREFERENCES
          ========================= */}
          {tab === "preferences" && (
            <div className="bg-white/95 rounded-xl p-6 max-w-lg shadow-md space-y-5">

              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Property Preferences
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Set your preferences to get better AI recommendations.
                </p>
              </div>

              {/* Budget */}
              <div className="grid grid-cols-2 gap-4">

                {/* Minimum Budget */}
                <div>
                  <label className="text-xs font-medium text-gray-600">
                    Min Budget
                  </label>

                  <input
                    type="number"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    value={prefs.budgetMin || ""}
                    onChange={(e) =>
                      setPrefs({
                        ...prefs,
                        budgetMin: Number(e.target.value),
                      })
                    }
                    placeholder="Minimum"
                  />
                </div>

                {/* Maximum Budget */}
                <div>
                  <label className="text-xs font-medium text-gray-600">
                    Max Budget
                  </label>

                  <input
                    type="number"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    value={prefs.budgetMax || ""}
                    onChange={(e) =>
                      setPrefs({
                        ...prefs,
                        budgetMax: Number(e.target.value),
                      })
                    }
                    placeholder="Maximum"
                  />
                </div>
              </div>

              {/* Preferred Cities */}
              <div>
                <label className="text-xs font-medium text-gray-600">
                  Preferred Cities
                </label>

                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  value={(prefs.preferredCities || []).join(", ")}
                  onChange={(e) =>
                    setPrefs({
                      ...prefs,
                      preferredCities: e.target.value
                        .split(",")
                        .map((city) => city.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="Delhi, Noida, Kanpur"
                />
              </div>

              {/* Preferred BHK */}
              <div>
                <label className="text-xs font-medium text-gray-600">
                  Preferred BHK
                </label>

                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  value={(prefs.bhk || []).join(", ")}
                  onChange={(e) =>
                    setPrefs({
                      ...prefs,
                      bhk: e.target.value
                        .split(",")
                        .map((value) => Number(value.trim()))
                        .filter((value) => value > 0),
                    })
                  }
                  placeholder="1, 2, 3"
                />
              </div>

              {/* Save Button */}
              <button
                onClick={savePrefs}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition"
              >
                Save Preferences
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}