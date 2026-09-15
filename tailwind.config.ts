import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "#fbf9f4",
        ink: "#1f2937",
        accent: { DEFAULT: "#0d9488", soft: "#d9f3ee" },
        coral: { DEFAULT: "#f97362", soft: "#ffe9e4" },
        sun: { DEFAULT: "#f5b82e", soft: "#fff3cf" },
        violet: { DEFAULT: "#7c6cf0", soft: "#ece9ff" },
        warn: "#ea580c",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        hand: ["var(--font-hand)", "cursive"],
      },
      keyframes: {
        float: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        wiggle: { "0%, 100%": { transform: "rotate(-2deg)" }, "50%": { transform: "rotate(2deg)" } },
      },
      animation: {
        float: "float 5s ease-in-out infinite",
        wiggle: "wiggle 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
