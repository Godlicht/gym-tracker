/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#050505",
        coal: "#0b0b0c",
        graphite: "#151517",
        panel: "#1b1b1e",
        line: "#2b2b31",
        ember: "#ff7a1a",
        amberline: "#f6a13a",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255, 122, 26, 0.18), 0 18px 60px rgba(0, 0, 0, 0.4)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};
