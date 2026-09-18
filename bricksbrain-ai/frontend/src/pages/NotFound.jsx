import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-6xl font-extrabold text-brand-600">404</h1>
      <p className="text-gray-500 mt-2 mb-6">Page not found.</p>
      <Link to="/" className="btn-primary">Back to Home</Link>
    </div>
  );
}
