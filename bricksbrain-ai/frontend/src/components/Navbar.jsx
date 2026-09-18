import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, Search, GitCompare, Calculator, MessageSquare, User, Menu, X, LayoutDashboard, PlusCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";

const NavLink = ({ to, children }) => (
  <Link to={to} className="text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors">
    {children}
  </Link>
);

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <img
  src={logo}
  alt="BrickBrain AI Logo"
  className="w-9 h-9 rounded-lg object-contain"
/>
            <span className="text-xl font-extrabold text-ink">Bricks<span className="text-brand-600">Brain AI</span> <span className="text-xs align-top font-semibold text-gray-400"></span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            <NavLink to="/listings"><span className="inline-flex items-center gap-1"><Search size={16}/> Buy</span></NavLink>
            <NavLink to="/listings?listingType=Rent"><span className="inline-flex items-center gap-1"><Home size={16}/> Rent</span></NavLink>
            <NavLink to="/compare"><span className="inline-flex items-center gap-1"><GitCompare size={16}/> Compare</span></NavLink>
            <NavLink to="/emi-calculator"><span className="inline-flex items-center gap-1"><Calculator size={16}/> EMI</span></NavLink>
            <NavLink to="/area-intelligence"><span className="inline-flex items-center gap-1">Area Intel</span></NavLink>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/list-property" className="hidden lg:inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg transition-colors">
              <PlusCircle size={16} /> Post Property <span className="text-brand-100 font-normal">FREE</span>
            </Link>
            {user ? (
              <>
                {user.role === "admin" && (
                  <Link to="/admin" className="text-sm font-medium text-gray-700 hover:text-brand-600 inline-flex items-center gap-1">
                    <LayoutDashboard size={16}/> Admin
                  </Link>
                )}
                <Link to="/dashboard" className="text-sm font-medium text-gray-700 hover:text-brand-600 inline-flex items-center gap-1">
                  <User size={16}/> {user.name?.split(" ")[0]}
                </Link>
                <button onClick={() => { logout(); navigate("/"); }} className="btn-outline !py-2 !px-4 text-sm">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-gray-700 hover:text-brand-600">Login</Link>
                <Link to="/register" className="btn-primary !py-2 !px-4 text-sm">Sign Up</Link>
              </>
            )}
          </div>

          <button className="md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-gray-100 px-4 py-3 space-y-3">
          <Link onClick={() => setOpen(false)} to="/listings" className="block text-sm font-medium">Buy</Link>
          <Link onClick={() => setOpen(false)} to="/listings?listingType=Rent" className="block text-sm font-medium">Rent</Link>
          <Link onClick={() => setOpen(false)} to="/compare" className="block text-sm font-medium">Compare</Link>
          <Link onClick={() => setOpen(false)} to="/emi-calculator" className="block text-sm font-medium">EMI Calculator</Link>
          <Link onClick={() => setOpen(false)} to="/area-intelligence" className="block text-sm font-medium">Area Intelligence</Link>
          <Link onClick={() => setOpen(false)} to="/list-property" className="block text-sm font-semibold text-brand-600">Post Property FREE</Link>
          <hr />
          {user ? (
            <>
              <Link onClick={() => setOpen(false)} to="/dashboard" className="block text-sm font-medium">Dashboard</Link>
              {user.role === "admin" && <Link onClick={() => setOpen(false)} to="/admin" className="block text-sm font-medium">Admin</Link>}
              <button onClick={() => { logout(); setOpen(false); navigate("/"); }} className="text-sm font-medium text-brand-600">Logout</button>
            </>
          ) : (
            <>
              <Link onClick={() => setOpen(false)} to="/login" className="block text-sm font-medium">Login</Link>
              <Link onClick={() => setOpen(false)} to="/register" className="block text-sm font-medium text-brand-600">Sign Up</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
