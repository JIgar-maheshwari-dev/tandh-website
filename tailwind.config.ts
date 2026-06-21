import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // tandh studio earthy palette
        weave: {
          DEFAULT: "#F6F1E7", // unbleached kala cotton — primary background
          50: "#FBF8F2",
          100: "#F6F1E7",
          200: "#ECE2CC",
        },
        ink: "#2A2118", // warm near-black for text
        indigo: {
          DEFAULT: "#2F3C5E", // deep indigo dye accent
          600: "#384B73",
          900: "#222C44",
        },
        terracotta: {
          DEFAULT: "#B85C38", // CTA accent — Babool/Khejri bark dye
          600: "#A34E2E",
          50: "#F6E6DC",
        },
        clay: "#C99166", // secondary accent
        bark: "#6B5544", // muted natural-dye brown
        line: "#E3D9C6", // hairline borders / dividers
      },
      fontFamily: {
        serif: ["var(--font-display)", "Cormorant Garamond", "Georgia", "serif"],
        sans: ["var(--font-body)", "Work Sans", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        widest2: "0.2em",
      },
      boxShadow: {
        weave: "0 8px 30px -10px rgba(42, 33, 24, 0.18)",
      },
    },
  },
  plugins: [],
};
export default config;
