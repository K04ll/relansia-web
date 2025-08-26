/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class", // important pour ton ThemeToggle
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
    },
  },
  plugins: [],
};
