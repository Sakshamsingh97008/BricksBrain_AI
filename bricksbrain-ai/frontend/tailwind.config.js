/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fef2f3",
          100: "#fde3e4",
          200: "#fbcbce",
          300: "#f7a3a8",
          400: "#f16f78",
          500: "#e63946",
          600: "#d4152a",
          700: "#b30f22",
          800: "#94101f",
          900: "#7c121f",
        },
        ink: "#1a1a2e",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 10px rgba(0,0,0,0.08)",
        cardHover: "0 8px 24px rgba(0,0,0,0.14)",
      },
    },
  },
  plugins: [],
};
