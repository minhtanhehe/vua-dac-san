/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#D4A373", // Amber Warm
          secondary: "#2D6A4F", // Forest Green
          accent: "#C97A34", // Terracotta
          dark: "#1A1A1A", // Charcoal
          bg: "#FAF7F2", // Rice Cream
          light: "#F4F1EA" // Light Sand
        }
      },
      fontFamily: {
        sans: ["Inter", "Plus Jakarta Sans", "sans-serif"],
        heading: ["Outfit", "Playfair Display", "sans-serif"]
      }
    },
  },
  plugins: [],
}
