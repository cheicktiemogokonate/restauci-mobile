/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Couleur principale de l'app (palette verte RestauCi)
        green: {
          50: "#f0fdf4",
          100: "#dcfce7",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        // Palette neutre — remplace les gris codés en dur (#111827, #6b7280, #f3f4f6...)
        ink: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          900: "#111827",
        },
        // Couleurs sémantiques
        info: "#3b82f6",
        danger: {
          50: "#fef2f2",
          200: "#fecaca",
          600: "#ef4444",
        },
        warning: "#f59e0b",
      },
    },
  },
  plugins: [],
};
