import React, { useState } from "react";
import { Paintbrush, Sparkles, Info } from "lucide-react";
import api from "../api/axios";

const ROOM_TYPES = ["Living Room", "Bedroom", "Kitchen", "Bathroom", "Dining Room", "Home Office"];
const STYLES = ["Modern", "Minimalist", "Traditional Indian", "Scandinavian", "Industrial", "Luxury"];

export default function InteriorDesign() {
  const [roomType, setRoomType] = useState("Living Room");
  const [style, setStyle] = useState("Modern");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/properties/interior-design", { roomType, style, notes });
      setResult(data);
    } catch (err) {
      setError("Couldn't generate design ideas right now. Please make sure the AI service is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-5">
      <h2 className="font-semibold text-lg mb-1 flex items-center gap-2">
        <Paintbrush size={18} className="text-brand-600" /> AI Interior Design Ideas
      </h2>
      <p className="text-xs text-gray-500 mb-4">
        Pick a room and a style — we'll generate design inspiration and tips to help you visualize the space.
      </p>

      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs font-medium text-gray-600">Room</label>
          <select value={roomType} onChange={(e) => setRoomType(e.target.value)} className="input-field mt-1">
            {ROOM_TYPES.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Style</label>
          <select value={style} onChange={(e) => setStyle(e.target.value)} className="input-field mt-1">
            {STYLES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Anything specific? e.g. 'pet-friendly', 'small space', 'lots of natural light'"
        className="input-field mb-3"
      />

      <button onClick={generate} disabled={loading} className="btn-primary w-full text-sm flex items-center justify-center gap-2">
        <Sparkles size={16} /> {loading ? "Generating ideas..." : "Generate Design Ideas"}
      </button>

      {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

      {result && (
        <div className="mt-5 space-y-4">
          {result.images?.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {result.images.map((src, i) => (
                <img key={i} src={src} alt={`${result.style} ${result.room_type} idea ${i + 1}`} className="w-full h-28 object-cover rounded-lg" />
              ))}
            </div>
          )}

          {result.tips?.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-ink mb-2">Design tips for {result.style}</p>
              <ul className="text-xs text-gray-600 space-y-1.5 list-disc pl-4">
                {result.tips.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          )}

          {result.note && (
            <p className="text-[11px] text-gray-400 flex items-start gap-1.5 bg-gray-50 rounded-lg p-2.5">
              <Info size={13} className="mt-0.5 shrink-0" /> {result.note}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
