import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bitmart-black": "#0B0E11",
        "bitmart-surface": "#13171C",
        "bitmart-card": "rgba(24, 24, 27, 0.4)",
        "bitmart-aurora": "#00C570",
        "bitmart-neon": "#F24957",
        "bitmart-border": "rgba(39, 39, 42, 0.4)",
        "bitmart-muted": "#71717A",
        "bitmart-accent": "#3B82F6",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
        mono: ["var(--font-geist-mono)"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-aurora":
          "linear-gradient(135deg, #00C570 0%, #00A050 100%)",
        "gradient-neon":
          "linear-gradient(135deg, #F24957 0%, #D03545 100%)",
        "gradient-card":
          "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%)",
      },
      backdropBlur: {
        xs: "2px",
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
      },
      animation: {
        "pulse-aurora": "pulse-aurora 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-neon": "glow-neon 2s ease-in-out infinite alternate",
        "slide-up": "slide-up 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
      },
      keyframes: {
        "pulse-aurora": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "glow-neon": {
          "0%": {
            "box-shadow": "0 0 5px rgba(242,73,87,0.3), 0 0 10px rgba(242,73,87,0.1)",
          },
          "100%": {
            "box-shadow": "0 0 10px rgba(242,73,87,0.5), 0 0 20px rgba(242,73,87,0.2)",
          },
        },
        "slide-up": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
