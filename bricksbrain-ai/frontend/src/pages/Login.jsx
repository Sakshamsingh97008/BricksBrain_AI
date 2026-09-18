import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import bgImage from "../assets/dashboard-bg.jpg";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const user = await login(form.email, form.password);

      navigate(user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center px-4 py-12"
      style={{
        backgroundImage: `url(${bgImage})`,
      }}
    >
      {/* =========================================
          BACKGROUND DARK OVERLAY
      ========================================= */}
      <div className="absolute inset-0 bg-black/35"></div>

      {/* =========================================
          LOGIN GLASS CARD
      ========================================= */}
      <div
        className="
          relative z-10
          w-full max-w-md
          bg-black/35
          backdrop-blur-md
          border border-white/30
          rounded-2xl
          shadow-2xl
          p-8
        "
      >
        {/* =========================================
            HEADING
        ========================================= */}
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back
        </h1>

        <p className="text-sm text-white/85 mb-7">
          Login to save properties and get personalized
          recommendations.
        </p>

        {/* =========================================
            LOGIN FORM
        ========================================= */}
        <form onSubmit={submit} className="space-y-5">

          {/* EMAIL */}
          <div>
            <label className="text-sm font-medium text-white/90">
              Email
            </label>

            <input
              required
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
                })
              }
              className="
                w-full
                mt-2
                px-4
                py-3
                bg-white/90
                border border-white/40
                rounded-lg
                text-gray-900
                placeholder-gray-500
                outline-none
                transition
                focus:bg-white
                focus:ring-2
                focus:ring-blue-400
              "
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="text-sm font-medium text-white/90">
              Password
            </label>

            <input
              required
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) =>
                setForm({
                  ...form,
                  password: e.target.value,
                })
              }
              className="
                w-full
                mt-2
                px-4
                py-3
                bg-white/90
                border border-white/40
                rounded-lg
                text-gray-900
                placeholder-gray-500
                outline-none
                transition
                focus:bg-white
                focus:ring-2
                focus:ring-blue-400
              "
            />
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div className="bg-red-500/20 border border-red-300/40 rounded-lg p-3">
              <p className="text-sm text-red-200">
                {error}
              </p>
            </div>
          )}

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="
              w-full
              py-3
              rounded-lg
              bg-blue-600
              hover:bg-blue-700
              disabled:bg-blue-400
              text-white
              font-semibold
              text-base
              transition
              shadow-lg
            "
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* =========================================
            DEMO CREDENTIALS
        ========================================= */}
        <div className="mt-6 text-center">
          <p className="text-xs text-white/75 leading-5">
            <span className="font-semibold text-white">
              Demo:
            </span>{" "}
            demo@bricksbrain.ai / demo1234
            <br />

            <span className="font-semibold text-white">
              Admin:
            </span>{" "}
            admin@bricksbrain.ai / admin123
          </p>
        </div>

        {/* =========================================
            REGISTER LINK
        ========================================= */}
        <p className="text-sm text-white/75 mt-7 text-center">
          New here?{" "}
          <Link
            to="/register"
            className="
              text-blue-300
              font-semibold
              hover:text-blue-200
              hover:underline
            "
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}