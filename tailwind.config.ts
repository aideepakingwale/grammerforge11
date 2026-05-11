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
        ink: "#17211f",
        paper: "#f4f7f6",
        pearl: "#fbfcfb",
        line: "#dfe7e4",
        moss: "#5a7b61",
        teal: "#116b70",
        mint: "#8fd3c7",
        coral: "#df6b57",
        gold: "#c9952b",
        lilac: "#8d7adf",
        skysoft: "#e2f2f4"
      },
      boxShadow: {
        soft: "0 18px 55px rgba(23, 33, 31, 0.12)",
        lift: "0 24px 70px rgba(23, 33, 31, 0.16)"
      }
    }
  },
  plugins: []
};

export default config;
