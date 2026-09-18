import React, { useEffect, useState } from "react";
import { getPropertyGalleryImages, getPropertyImage } from "../utils/imageUrl";
import { useParams, Link } from "react-router-dom";
import { MapPin, BedDouble, Bath, Ruler, Compass, Building2, Heart, TrendingUp, Sparkles, FileDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import api from "../api/axios";
import { formatPrice } from "../components/PropertyCard";
import MapView from "../components/MapView";
import DigitalTwin3D from "../components/DigitalTwin3D";
import ConstructionCost from "../components/ConstructionCost";
import InteriorDesign from "../components/InteriorDesign";
import { useAuth } from "../context/AuthContext";
import { generatePropertyReport } from "../utils/generateReport";

export default function PropertyDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [prediction, setPrediction] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [forecasting, setForecasting] = useState(false);

  useEffect(() => {
    api.get(`/properties/${id}`).then(({ data }) => setProperty(data.property));
  }, [id]);

  const runPrediction = async () => {
    if (!property) return;
    setPredicting(true);
    try {
      const { data } = await api.post("/properties/predict-price", {
        city: property.city, propertyType: property.propertyType, furnishing: property.furnishing,
        bhk: property.bhk, bathrooms: property.bathrooms, areaSqft: property.areaSqft,
        age: property.ageOfProperty, floor: property.floor, totalFloors: property.totalFloors,
      });
      setPrediction(data);
    } catch (err) {
      setPrediction({ error: "AI service unavailable. Please start the ai-service (uvicorn main:app)." });
    } finally {
      setPredicting(false);
    }
  };

  const runForecast = async () => {
    if (!property) return;
    setForecasting(true);
    try {
      const { data } = await api.post("/properties/forecast", { city: property.city, areaSqft: property.areaSqft, monthsAhead: 36 });
      setForecast(data);
    } catch (err) {
      setForecast({ error: "AI service unavailable." });
    } finally {
      setForecasting(false);
    }
  };

  const handleDownloadReport = () => {
    generatePropertyReport(property, { prediction, forecast });
  };

  if (!property) return <div className="min-h-[60vh] flex items-center justify-center text-gray-400">Loading property...</div>;

  const galleryImages = getPropertyGalleryImages(property);

  const chartData = forecast?.arima
    ? forecast.arima.dates.map((d, i) => ({
        date: d,
        ARIMA: forecast.arima.predicted_total_price[i],
        LSTM: forecast.lstm.predicted_total_price[i],
      })).filter((_, i) => i % 3 === 0)
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Image Gallery */}
      <div className="grid md:grid-cols-4 gap-2 mb-6 rounded-xl overflow-hidden">
        <img src={galleryImages[activeImg] || getPropertyImage(property)} className="md:col-span-3 w-full h-[420px] object-cover" alt={property.title} />
        <div className="grid grid-cols-4 md:grid-cols-1 gap-2">
          {galleryImages.map((img, i) => (
            <img key={i} src={img} onClick={() => setActiveImg(i)}
              className={`w-full h-24 md:h-[132px] object-cover cursor-pointer rounded-lg ${activeImg === i ? "ring-2 ring-brand-600" : ""}`} alt="" />
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-ink">{property.title}</h1>
                <p className="text-gray-500 flex items-center gap-1 mt-1"><MapPin size={14} /> {property.address}, {property.locality}, {property.city}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={handleDownloadReport} title="Download PDF report" className="h-10 px-3 rounded-full border border-gray-200 flex items-center gap-1.5 text-gray-500 hover:text-brand-600 hover:border-brand-600 text-xs font-medium">
                  <FileDown size={16} /> Report
                </button>
                <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-brand-600 hover:border-brand-600">
                  <Heart size={18} />
                </button>
              </div>
            </div>
            <p className="text-3xl font-extrabold text-brand-600 mt-4">{formatPrice(property.price)}
              <span className="text-sm font-medium text-gray-400 ml-2">₹{Math.round(property.price / property.areaSqft).toLocaleString("en-IN")}/sqft</span>
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              {[
                { icon: BedDouble, label: `${property.bhk} BHK` },
                { icon: Bath, label: `${property.bathrooms} Bath` },
                { icon: Ruler, label: `${property.areaSqft} sqft` },
                { icon: Compass, label: property.facing },
                { icon: Building2, label: `Floor ${property.floor}/${property.totalFloors}` },
              ].map((s, i) => (
                <div key={i} className="card p-3 text-center">
                  <s.icon size={18} className="mx-auto text-brand-600 mb-1" />
                  <p className="text-xs font-medium text-gray-700">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="font-semibold text-lg mb-2">About this property</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{property.description}</p>
          </div>

          {property.propertyType === "Plot" && (
            <ConstructionCost areaSqft={property.areaSqft} propertyType={property.propertyType} />
          )}

          {/* Amenities */}
          <div>
            <h2 className="font-semibold text-lg mb-2">Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {property.amenities.map((a, i) => (
                <span key={i} className="bg-brand-50 text-brand-700 text-xs font-medium px-3 py-1.5 rounded-full">{a}</span>
              ))}
            </div>
          </div>

          {/* 3D Digital Twin */}
          <DigitalTwin3D bhk={property.bhk} areaSqft={property.areaSqft} propertyType={property.propertyType} />

          {/* AI Interior Design */}
          <InteriorDesign />

          {/* Map */}
          <div>
            <h2 className="font-semibold text-lg mb-2">Location</h2>
            <MapView lat={property.location.lat} lng={property.location.lng} title={property.title} />
          </div>

          {/* Area Intelligence */}
          <div className="card p-5">
            <h2 className="font-semibold text-lg mb-4">Area Intelligence</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                ["Walk Score", property.areaIntelligence.walkScore],
                ["Safety Score", property.areaIntelligence.safetyScore],
                ["Connectivity", property.areaIntelligence.connectivityScore],
                ["Nearby Schools", property.areaIntelligence.nearbySchools],
                ["Nearby Hospitals", property.areaIntelligence.nearbyHospitals],
                ["5yr Price Growth", `${property.areaIntelligence.priceGrowth5yr}%`],
              ].map(([label, val], i) => (
                <div key={i}>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-lg font-bold text-ink">{val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar tools */}
        <div className="space-y-6">
          {/* AI Price Prediction */}
          <div className="card p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3"><Sparkles size={16} className="text-brand-600"/> AI Price Prediction</h3>
            <p className="text-xs text-gray-500 mb-3">Estimate fair market value using our trained ML model.</p>
            <button onClick={runPrediction} disabled={predicting} className="btn-primary w-full text-sm">
              {predicting ? "Predicting..." : "Predict Price"}
            </button>
            {prediction && !prediction.error && (
              <div className="mt-4 bg-brand-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Estimated Price</p>
                <p className="text-xl font-bold text-brand-700">{formatPrice(prediction.predicted_price)}</p>
                <p className="text-xs text-gray-500 mt-1">Range: {formatPrice(prediction.price_range.min)} - {formatPrice(prediction.price_range.max)}</p>
                <p className="text-[11px] text-gray-400 mt-1">{prediction.method}</p>
              </div>
            )}
            {prediction?.error && <p className="text-xs text-red-500 mt-2">{prediction.error}</p>}
          </div>

          {/* Forecast */}
          <div className="card p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3"><TrendingUp size={16} className="text-brand-600"/> Price Forecast (3yr)</h3>
            <p className="text-xs text-gray-500 mb-3">ARIMA & neural forecast for {property.city}.</p>
            <button onClick={runForecast} disabled={forecasting} className="btn-outline w-full text-sm">
              {forecasting ? "Forecasting..." : "Run Forecast"}
            </button>
            {forecast && !forecast.error && (
              <div className="mt-4">
                <div className="grid grid-cols-2 gap-2 text-center mb-3">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-[10px] text-gray-500">1yr (ARIMA)</p>
                    <p className="text-sm font-bold text-ink">{formatPrice(forecast.summary.forecast_1yr_arima)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-[10px] text-gray-500">3yr (ARIMA)</p>
                    <p className="text-sm font-bold text-ink">{formatPrice(forecast.summary.forecast_3yr_arima)}</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={2} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip formatter={(v) => formatPrice(v)} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="ARIMA" stroke="#e63946" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="LSTM" stroke="#1a1a2e" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            {forecast?.error && <p className="text-xs text-red-500 mt-2">{forecast.error}</p>}
          </div>

          <Link to="/emi-calculator" state={{ amount: property.price }} className="card p-5 block hover:shadow-cardHover">
            <h3 className="font-semibold mb-1">Calculate EMI</h3>
            <p className="text-xs text-gray-500">Plan your home loan for this {formatPrice(property.price)} property.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
