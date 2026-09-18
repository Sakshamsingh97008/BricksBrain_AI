import React, { useEffect, useState } from "react";
import { getPropertyImage } from "../utils/imageUrl";
import { Users, Building2, Eye, ListChecks, Check, X, Clock, TrendingUp, ArrowUpRight, ShieldCheck, BarChart3, PlusCircle, Pencil, Trash2, Save, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import api from "../api/axios";
import { formatPrice } from "../components/PropertyCard";

const COLORS = ["#e63946", "#1a1a2e", "#f16f78", "#7c121f", "#f7a3a8"];

const compactNumber = (value = 0) => new Intl.NumberFormat("en-IN", {
  notation: value >= 1000 ? "compact" : "standard",
  maximumFractionDigits: 1,
}).format(value);

const emptyForm = {
  title: "",
  description: "",
  propertyType: "Apartment",
  listingType: "Sale",
  price: "",
  areaSqft: "",
  bhk: "2",
  bathrooms: "2",
  furnishing: "Unfurnished",
  floor: "0",
  totalFloors: "1",
  ageOfProperty: "0",
  facing: "North",
  city: "Bangalore",
  locality: "",
  address: "",
  contactPhone: "",
  status: "Active",
};

const cities = ["Bangalore", "Mumbai", "Delhi", "Pune", "Hyderabad", "Chennai", "Gurugram", "Noida"];
const propertyTypes = ["Apartment", "Villa", "Independent House", "Plot", "Commercial", "Studio"];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [pending, setPending] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchDashboard = async () => {
    try {
      const [statsRes, propsRes, pendingRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/properties?limit=200"),
        api.get("/admin/pending-properties"),
      ]);

      setData(statsRes.data);
      setProperties(propsRes.data.properties || []);
      setPending(pendingRes.data.properties || []);
    } catch (err) {
      console.error("Error loading admin dashboard:", err);
    }
  };

  useEffect(() => {
    fetchDashboard();
    loadPending();
  }, []);

  const loadPending = async () => {
    setLoadingPending(true);
    try {
      const { data } = await api.get("/admin/pending-properties");
      setPending(data.properties || []);
    } catch (err) {
      console.error("Error loading pending properties:", err);
    } finally {
      setLoadingPending(false);
    }
  };

  const reviewProperty = async (id, status) => {
    try {
      await api.put(`/properties/${id}`, { status });
      setPending((p) => p.filter((prop) => prop._id !== id));
      await fetchDashboard();
    } catch (err) {
      alert("Failed to update listing status");
    }
  };

  const handleFieldChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (property) => {
    setEditingId(property._id);
    setForm({
      title: property.title || "",
      description: property.description || "",
      propertyType: property.propertyType || "Apartment",
      listingType: property.listingType || "Sale",
      price: String(property.price || ""),
      areaSqft: String(property.areaSqft || ""),
      bhk: String(property.bhk || 2),
      bathrooms: String(property.bathrooms || 2),
      furnishing: property.furnishing || "Unfurnished",
      floor: String(property.floor || 0),
      totalFloors: String(property.totalFloors || 1),
      ageOfProperty: String(property.ageOfProperty || 0),
      facing: property.facing || "North",
      city: property.city || "Bangalore",
      locality: property.locality || "",
      address: property.address || "",
      contactPhone: property.contactPhone || "",
      status: property.status || "Active",
    });
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...form,
        price: Number(form.price),
        areaSqft: Number(form.areaSqft),
        bhk: Number(form.bhk),
        bathrooms: Number(form.bathrooms),
        floor: Number(form.floor),
        totalFloors: Number(form.totalFloors),
        ageOfProperty: Number(form.ageOfProperty),
      };

      if (editingId) {
        await api.put(`/properties/${editingId}`, payload);
      } else {
        await api.post("/properties", payload);
      }

      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      await fetchDashboard();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save property");
    } finally {
      setSaving(false);
    }
  };

  const deleteProperty = async (id) => {
    if (!window.confirm("Are you sure you want to delete this property?")) return;

    try {
      await api.delete(`/properties/${id}`);
      await fetchDashboard();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete property");
    }
  };

  const { stats, propertiesByType, propertiesByCity, recentUsers, recentProperties } = data || {};

  const safeStats = stats || { totalUsers: 0, totalProperties: 0, activeListings: 0, totalViews: 0 };
  const safeTypeData = propertiesByType || [];
  const safeCityData = propertiesByCity || [];
  const safeUsers = recentUsers || [];
  const safeProperties = recentProperties || [];

  const avgPrice = safeProperties.length
    ? safeProperties.reduce((sum, p) => sum + Number(p.price || 0), 0) / safeProperties.length
    : 0;

  const approvalRate = safeStats.totalProperties
    ? Math.round((safeStats.activeListings / safeStats.totalProperties) * 100)
    : 0;

  const cards = [
    { label: "Total Users", value: safeStats.totalUsers, icon: Users, growth: "+8.2%", tone: "rose" },
    { label: "Total Properties", value: safeStats.totalProperties, icon: Building2, growth: "+14.4%", tone: "orange" },
    { label: "Active Listings", value: safeStats.activeListings, icon: ListChecks, growth: "+6.1%", tone: "red" },
    { label: "Total Views", value: safeStats.totalViews, icon: Eye, growth: "+21.8%", tone: "slate" },
  ];

  const typeBreakdown = safeTypeData.map((item, index) => ({
    ...item,
    name: item._id,
    percent: safeStats.totalProperties ? Math.round((item.count / safeStats.totalProperties) * 100) : 0,
    fill: COLORS[index % COLORS.length],
  }));

  const renderDonutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
    if (!value) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

    return (
      <text x={x} y={y} fill="#1f2937" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
        {value}
      </text>
    );
  };

  if (!data) return <div className="min-h-[60vh] flex items-center justify-center text-slate-400">Loading admin dashboard...</div>;

  return (
    <div className="min-h-screen bg-[#f4f1f0]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#d94c5a]">Overview</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-[2.1rem]">Admin Dashboard</h1>
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl border border-[#e7d9d8] bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#d94c5a] hover:text-[#d94c5a]">
            <BarChart3 size={16} />
            Export Report
          </button>
        </div>

        <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-[#f0e5e4] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_32px_rgba(15,23,42,0.06)]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    card.tone === "rose" ? "bg-[#ffe6e8] text-[#d94c5a]" :
                    card.tone === "orange" ? "bg-[#fff1db] text-[#ef8b1d]" :
                    card.tone === "red" ? "bg-[#ffe3e5] text-[#dc4c57]" :
                    "bg-[#edf2ff] text-[#5a6fd4]"
                  }`}>
                    <card.icon size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">{card.label}</p>
                    <p className="mt-1 text-[1.8rem] font-extrabold leading-none text-slate-900">{compactNumber(card.value)}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#fdf1f2] px-2 py-1 text-[10px] font-bold text-[#d94c5a]">
                  <ArrowUpRight size={12} />
                  {card.growth}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-7 rounded-2xl border border-[#eee3e3] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff4d8] text-[#d98b2b]">
                <Clock size={16} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Pending Approvals</h3>
                <p className="text-xs text-slate-500">Properties submitted by users waiting for review.</p>
              </div>
            </div>
            <span className="rounded-full bg-[#fff3f5] px-2.5 py-1 text-xs font-bold text-[#d94c5a]">{pending.length} new</span>
          </div>

          {loadingPending ? (
            <p className="py-2 text-sm text-slate-400">Loading...</p>
          ) : pending.length === 0 ? (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-[#f0d7d9] bg-[#fff9f9] py-8 text-center">
              <div>
                <ShieldCheck className="mx-auto mb-2 text-[#1cbf7b]" size={20} />
                <p className="text-sm font-medium text-slate-700">No listings awaiting review.</p>
                <p className="text-xs text-slate-500">Everything is caught up.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((p) => (
                <div key={p._id} className="flex flex-col gap-3 rounded-xl border border-[#f4e7e8] bg-[#fffdfd] p-3 sm:flex-row sm:items-center">
                  <img src={getPropertyImage(p)} alt={p.title} className="h-16 w-16 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{p.title}</p>
                    <p className="text-xs text-slate-500">{p.locality}, {p.city} · {formatPrice(p.price)}</p>
                    <p className="mt-1 text-[11px] text-slate-400">Posted by {p.owner?.name || "Unknown"} · {p.owner?.email || "-"}</p>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button onClick={() => reviewProperty(p._id, "Active")} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eafaf1] text-[#1a9f64] transition hover:bg-[#dff6ea]" title="Approve">
                      <Check size={16} />
                    </button>
                    <button onClick={() => reviewProperty(p._id, "Rejected")} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ffecef] text-[#d94c5a] transition hover:bg-[#ffdfe6]" title="Reject">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-7 rounded-2xl border border-[#eee3e3] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Manage Properties</h3>
              <p className="text-xs text-slate-500">Add, update, or remove listings from the platform.</p>
            </div>
            <button onClick={openAddForm} className="inline-flex items-center gap-2 rounded-xl bg-[#d94c5a] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c73f50]">
              <PlusCircle size={15} />
              Add Property
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="mb-5 rounded-2xl border border-[#f1dfe1] bg-[#fffafa] p-4">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-base font-bold text-slate-800">{editingId ? "Edit property" : "Add new property"}</h4>
                <button type="button" onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-700">
                  <X size={18} />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-600">Title</label>
                  <input value={form.title} onChange={handleFieldChange("title")} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#d94c5a] focus:outline-none" required />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-600">Description</label>
                  <textarea value={form.description} onChange={handleFieldChange("description")} rows={3} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#d94c5a] focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Property type</label>
                  <select value={form.propertyType} onChange={handleFieldChange("propertyType")} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#d94c5a] focus:outline-none">
                    {propertyTypes.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Listing type</label>
                  <select value={form.listingType} onChange={handleFieldChange("listingType")} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#d94c5a] focus:outline-none">
                    <option value="Sale">Sale</option>
                    <option value="Rent">Rent</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Price</label>
                  <input type="number" value={form.price} onChange={handleFieldChange("price")} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#d94c5a] focus:outline-none" required />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Area sqft</label>
                  <input type="number" value={form.areaSqft} onChange={handleFieldChange("areaSqft")} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#d94c5a] focus:outline-none" required />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">BHK</label>
                  <input type="number" value={form.bhk} onChange={handleFieldChange("bhk")} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#d94c5a] focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Bathrooms</label>
                  <input type="number" value={form.bathrooms} onChange={handleFieldChange("bathrooms")} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#d94c5a] focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Furnishing</label>
                  <select value={form.furnishing} onChange={handleFieldChange("furnishing")} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#d94c5a] focus:outline-none">
                    <option value="Unfurnished">Unfurnished</option>
                    <option value="Semi-Furnished">Semi-Furnished</option>
                    <option value="Furnished">Furnished</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
                  <select value={form.status} onChange={handleFieldChange("status")} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#d94c5a] focus:outline-none">
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Floor</label>
                  <input type="number" value={form.floor} onChange={handleFieldChange("floor")} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#d94c5a] focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Total floors</label>
                  <input type="number" value={form.totalFloors} onChange={handleFieldChange("totalFloors")} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#d94c5a] focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Age</label>
                  <input type="number" value={form.ageOfProperty} onChange={handleFieldChange("ageOfProperty")} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#d94c5a] focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Facing</label>
                  <select value={form.facing} onChange={handleFieldChange("facing")} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#d94c5a] focus:outline-none">
                    {['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'].map((side) => <option key={side} value={side}>{side}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">City</label>
                  <select value={form.city} onChange={handleFieldChange("city")} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#d94c5a] focus:outline-none">
                    {cities.map((city) => <option key={city} value={city}>{city}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Locality</label>
                  <input value={form.locality} onChange={handleFieldChange("locality")} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#d94c5a] focus:outline-none" required />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-600">Address</label>
                  <input value={form.address} onChange={handleFieldChange("address")} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#d94c5a] focus:outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-600">Contact phone</label>
                  <input value={form.contactPhone} onChange={handleFieldChange("contactPhone")} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#d94c5a] focus:outline-none" />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#d94c5a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c73f50] disabled:opacity-70">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {saving ? "Saving..." : editingId ? "Update property" : "Add property"}
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 pr-4 font-medium">Property</th>
                  <th className="pb-3 pr-4 font-medium">City</th>
                  <th className="pb-3 pr-4 font-medium">Type</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Price</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => (
                  <tr key={property._id} className="border-b border-slate-100 align-middle">
                    <td className="py-3 pr-4">
                      <div className="min-w-[180px]">
                        <p className="truncate font-semibold text-slate-800">{property.title}</p>
                        <p className="text-xs text-slate-500">{property.locality}</p>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{property.city}</td>
                    <td className="py-3 pr-4 text-slate-600">{property.propertyType}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${property.status === "Active" ? "bg-emerald-100 text-emerald-700" : property.status === "Pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                        {property.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-semibold text-slate-800">{formatPrice(property.price)}</td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditForm(property)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-[#d94c5a] hover:text-[#d94c5a]">
                          <Pencil size={12} />
                          Edit
                        </button>
                        <button onClick={() => deleteProperty(property._id)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100">
                          <Trash2 size={12} />
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-7 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#eee3e3] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Properties by Type</h3>
              <span className="rounded-full bg-[#fff3f5] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#d94c5a]">mix</span>
            </div>
            <div className="h-[270px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typeBreakdown} dataKey="count" nameKey="name" innerRadius={52} outerRadius={80} labelLine={false} label={renderDonutLabel} paddingAngle={2}>
                    {typeBreakdown.map((entry, index) => <Cell key={`${entry.name}-${index}`} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} listings`, "Count"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {typeBreakdown.map((item) => (
                <div key={item.name} className="flex items-center gap-2 rounded-full bg-slate-50 px-2 py-1 text-[11px] text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.fill }} />
                  {item.name}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#eee3e3] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Top Cities by Listings</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#fff5f6] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#d94c5a]">
                <TrendingUp size={12} />
                {approvalRate}% active
              </span>
            </div>
            <div className="h-[270px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={safeCityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="_id" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => [`${value} listings`, "Listings"]} />
                  <Bar dataKey="count" fill="#e63946" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#eee3e3] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Recent Users</h3>
              <span className="text-xs font-medium text-slate-500">New signups</span>
            </div>
            <div className="space-y-3">
              {safeUsers.map((user) => (
                <div key={user._id} className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">{user.role}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#eee3e3] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Recent Properties</h3>
              <span className="text-xs font-medium text-slate-500">Avg. {formatPrice(avgPrice)}</span>
            </div>
            <div className="space-y-3">
              {safeProperties.map((property) => (
                <div key={property._id} className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{property.title}</p>
                    <p className="text-[11px] text-slate-500">{property.city}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800">{formatPrice(property.price)}</p>
                    <p className="text-[10px] uppercase tracking-wide text-[#d94c5a]">listed</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
