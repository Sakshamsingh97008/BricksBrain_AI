import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-ink text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-extrabold">B</div>
            <span className="text-lg font-extrabold text-white">BricksBrain AI</span>
          </div>
          <p className="text-sm text-gray-400 max-w-sm">
            An AI-powered real estate platform for smarter buying, selling, and renting —
            with ML price prediction, forecasting, area intelligence, and 3D digital twins.
          </p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Explore</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/listings" className="hover:text-brand-400">Buy Property</Link></li>
            <li><Link to="/listings?listingType=Rent" className="hover:text-brand-400">Rent Property</Link></li>
            <li><Link to="/compare" className="hover:text-brand-400">Compare Properties</Link></li>
            <li><Link to="/area-intelligence" className="hover:text-brand-400">Area Intelligence</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Tools</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/emi-calculator" className="hover:text-brand-400">EMI Calculator</Link></li>
            <li><Link to="/listings" className="hover:text-brand-400">Price Prediction</Link></li>
            <li><Link to="/dashboard" className="hover:text-brand-400">My Dashboard</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} BricksBrain AI. Built as a demonstration full-stack + ML project.
      </div>
    </footer>
  );
}
