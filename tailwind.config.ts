import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Baloo Thai 2"', "system-ui", "sans-serif"],
        body: ["Sarabun", "system-ui", "sans-serif"],
      },
      colors: {
        cream: "#FFF7ED",
        ink: "#3A2A1A",
        brand: { DEFAULT: "#F97316", dark: "#EA580C" },
        sun: "#FBBF24",
        berry: "#FB7185",
        sky: "#38BDF8",
      },
      boxShadow: {
        soft: "0 18px 40px -20px rgba(234,88,12,.35)",
        card: "0 12px 30px -14px rgba(120,80,30,.28)",
      },
    },
  },
  plugins: [],
};
export default config;
