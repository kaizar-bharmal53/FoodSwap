import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Arial as the primary body font (system font — no download needed)
        body:    ["Arial", "Helvetica Neue", "Helvetica", "sans-serif"],
        // Playfair Display (New Spirit substitute) for headings
        display: ["var(--font-display)", "Georgia", "Times New Roman", "serif"],
      },
      colors: {
        brand: {
          50:  "#fff0f8",
          100: "#ffe0f2",
          200: "#ffc1e6",
          300: "#ff94d4",
          400: "#fe5cbb",
          500: "#fe2ba2",
          600: "#e0148b",
          700: "#bc0b73",
          800: "#99095d",
          900: "#7e0a4e",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      boxShadow: {
        "card": "0 0 0 1px rgba(0,0,0,.06), 0 2px 4px rgba(0,0,0,.05)",
        "card-hover": "0 0 0 1px rgba(0,0,0,.08), 0 6px 16px rgba(0,0,0,.08)",
        "panel": "0 0 0 1px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.06)",
      },
      animation: {
        "fade-in": "fadeIn .15s ease-out both",
        "slide-up": "slideUp .2s ease-out both",
        "pop": "pop .12s ease-out both",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { opacity: "0", transform: "translateY(6px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        pop: { "0%": { transform: "scale(.97)" }, "60%": { transform: "scale(1.02)" }, "100%": { transform: "scale(1)" } },
      },
    },
  },
  plugins: [],
};

export default config;
