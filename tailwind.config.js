/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./emails/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary)",
        danger: "var(--danger)",
        surface: "var(--surface)",
        border: "var(--border)",
        ring: "var(--ring)",
        "text-dim": "var(--text-dim)",
      },
      // ✅ Ajoute les polices DANS extend
      fontFamily: {
  sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
  hr: ["var(--font-hr)", "ui-sans-serif", "system-ui", "sans-serif"],
},
    },
  },
  plugins: [],
};
