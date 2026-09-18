import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, X, CheckCircle2, Home as HomeIcon } from "lucide-react";
import api from "../api/axios";

const CITIES = ["Bangalore", "Mumbai", "Delhi", "Pune", "Hyderabad", "Chennai", "Gurugram", "Noida"];
const PROPERTY_TYPES = ["Apartment", "Villa", "Independent House", "Plot", "Commercial", "Studio"];
const FURNISHING = ["Unfurnished", "Semi-Furnished", "Furnished"];
const AMENITIES = [
  "Swimming Pool", "Gym", "Clubhouse", "24x7 Security", "Power Backup",
  "Children's Play Area", "Park", "Covered Parking", "Lift", "Rainwater Harvesting",
];

const initialForm = {
  title: "", description: "", propertyType: "Apartment", listingType: "Sale",
  price: "", areaSqft: "", bhk: 2, bathrooms: 2, furnishing: "Unfurnished",
  floor: "", totalFloors: "", ageOfProperty: "", facing: "North",
  city: "", locality: "", address: "", contactPhone: "",
};

export default function ListProperty() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [amenities, setAmenities] = useState([]);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const toggleAmenity = (a) =>
    setAmenities((list) => (list.includes(a) ? list.filter((x) => x !== a) : [...list, a]));

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files || []).slice(0, 8 - files.length);
    setFiles((f) => [...f, ...selected]);
    setPreviews((p) => [...p, ...selected.map((f) => URL.createObjectURL(f))]);
  };

  const removeFile = (idx) => {
    setFiles((f) => f.filter((_, i) => i !== idx));
    setPreviews((p) => p.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (files.length === 0) {
      setError("Please upload at least one photo of the property.");
      return;
    }
    if (!form.title || !form.price || !form.areaSqft || !form.city || !form.locality) {
      setError("Please fill in title, price, area, city, and locality.");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append("amenities", JSON.stringify(amenities));
      files.forEach((f) => fd.append("images", f));

      const { data } = await api.post("/properties/list", fd);
      setSuccess(data);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong while submitting your property.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <CheckCircle2 size={56} className="mx-auto text-green-500 mb-4" />
        <h1 className="text-2xl font-bold text-ink mb-2">Property submitted!</h1>
        <p className="text-gray-500 mb-6">{success.message}</p>
        <div className="flex justify-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="btn-primary">Go to Dashboard</button>
          <button onClick={() => { setSuccess(null); setForm(initialForm); setAmenities([]); setFiles([]); setPreviews([]); }} className="btn-outline">
            List another property
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-2 mb-1">
        <HomeIcon className="text-brand-600" size={22} />
        <h1 className="text-2xl font-bold text-ink">Post Your Property — FREE</h1>
      </div>
      <p className="text-gray-500 text-sm mb-8">
        Reach lakhs of buyers and tenants. Fill in the details below and add a few photos —
        your listing goes live after a quick review.
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic details */}
        <section className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink">Basic Details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-gray-600">Title *</label>
              <input value={form.title} onChange={update("title")} placeholder="e.g. 3 BHK Apartment in Whitefield, Bangalore" className="input-field mt-1" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-gray-600">Description</label>
              <textarea value={form.description} onChange={update("description")} rows={3} placeholder="Describe your property..." className="input-field mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Property Type</label>
              <select value={form.propertyType} onChange={update("propertyType")} className="input-field mt-1">
                {PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Listing Type</label>
              <select value={form.listingType} onChange={update("listingType")} className="input-field mt-1">
                <option value="Sale">For Sale</option>
                <option value="Rent">For Rent</option>
              </select>
            </div>
          </div>
        </section>

        {/* Specs */}
        <section className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink">Specifications</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">Price (₹) *</label>
              <input type="number" value={form.price} onChange={update("price")} className="input-field mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Area (sqft) *</label>
              <input type="number" value={form.areaSqft} onChange={update("areaSqft")} className="input-field mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">BHK</label>
              <input type="number" min="0" value={form.bhk} onChange={update("bhk")} className="input-field mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Bathrooms</label>
              <input type="number" min="0" value={form.bathrooms} onChange={update("bathrooms")} className="input-field mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Furnishing</label>
              <select value={form.furnishing} onChange={update("furnishing")} className="input-field mt-1">
                {FURNISHING.map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Floor</label>
              <input type="number" value={form.floor} onChange={update("floor")} className="input-field mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Total Floors</label>
              <input type="number" value={form.totalFloors} onChange={update("totalFloors")} className="input-field mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Age (years)</label>
              <input type="number" value={form.ageOfProperty} onChange={update("ageOfProperty")} className="input-field mt-1" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Facing</label>
            <select value={form.facing} onChange={update("facing")} className="input-field mt-1 max-w-xs">
              {["North", "South", "East", "West", "North-East", "North-West", "South-East", "South-West"].map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-2">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((a) => (
                <button type="button" key={a} onClick={() => toggleAmenity(a)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${amenities.includes(a) ? "bg-brand-600 text-white border-brand-600" : "border-gray-300 text-gray-600 hover:border-brand-400"}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink">Location</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">City *</label>
              <select value={form.city} onChange={update("city")} className="input-field mt-1">
                <option value="">Select city</option>
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Locality *</label>
              <input value={form.locality} onChange={update("locality")} placeholder="e.g. Whitefield" className="input-field mt-1" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-gray-600">Address</label>
              <input value={form.address} onChange={update("address")} className="input-field mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Contact Phone</label>
              <input value={form.contactPhone} onChange={update("contactPhone")} placeholder="For interested buyers/tenants to reach you" className="input-field mt-1" />
            </div>
          </div>
        </section>

        {/* Photos */}
        <section className="card p-6 space-y-4">
          <h2 className="font-semibold text-ink">Photos *</h2>
          <p className="text-xs text-gray-500">Upload up to 8 photos (JPG/PNG/WEBP, max 5MB each). Listings with real photos get far more views.</p>

          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl py-8 cursor-pointer hover:border-brand-400 transition-colors">
            <UploadCloud className="text-gray-400 mb-2" size={28} />
            <span className="text-sm text-gray-500">Click to upload photos</span>
            <input type="file" accept="image/*" multiple hidden onChange={handleFiles} disabled={files.length >= 8} />
          </label>

          {previews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {previews.map((src, i) => (
                <div key={i} className="relative group">
                  <img src={src} alt="" className="w-full h-24 object-cover rounded-lg" />
                  <button type="button" onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
          {submitting ? "Submitting..." : "Submit Property"}
        </button>
      </form>
    </div>
  );
}
