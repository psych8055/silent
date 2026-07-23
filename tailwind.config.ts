import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: "#08090D",
          soft: "#0D0F16",
          glass: "rgba(255,255,255,0.035)",
          border: "rgba(255,255,255,0.08)",
        },
        mind: {
          // "your thoughts" — soft bioluminescent teal
          self: "#6EE7DB",
          selfDim: "#2E4F4C",
        },
        other: {
          // "their thoughts" — soft violet
          them: "#B9A6FF",
          themDim: "#453E63",
        },
        mist: "#8A8F9C",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        thought: ["var(--font-newsreader)", "serif"],
        ui: ["var(--font-inter)", "sans-serif"],
      },
      keyframes: {
        breathe: {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "0.9", transform: "scale(1.015)" },
        },
        driftIn: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        fadeGrain: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        breathe: "breathe 6s ease-in-out infinite",
        driftIn: "driftIn 0.5s ease-out",
        pulseDot: "pulseDot 1.4s ease-in-out infinite",
        fadeGrain: "fadeGrain 1.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
