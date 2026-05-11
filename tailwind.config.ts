import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./frontend/**/*.{ts,tsx}",
    "./backend/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        paper: "#f3f5fb",
        pearl: "#ffffff",
        line: "#d9e0ec",
        moss: "#10b981",
        teal: "#4f46e5",
        mint: "#eafaf3",
        coral: "#e11d48",
        gold: "#f59e0b",
        lilac: "#8b5cf6",
        skysoft: "#eef2ff"
      },
      boxShadow: {
        soft: "0 1px 2px rgba(24, 36, 51, 0.08)",
        lift: "0 8px 24px rgba(24, 36, 51, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
