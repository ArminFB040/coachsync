
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
        background: '#1a202c', // Anthrazit
        card: '#2d3748',       // Etwas helleres Anthrazit für Karten
        primary: '#34d399',    // Smaragdgrün
        'primary-hover': '#10b981',
        text: '#e2e8f0',
        'text-secondary': '#a0aec0',
      },
      keyframes: {
        success: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
          '100%': { opacity: '0', transform: 'scale(1)' },
        },
      },
      animation: {
        success: 'success 1.5s ease-in-out forwards',
      },
    },
  },
  plugins: [],
};
export default config;

