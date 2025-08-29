/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./emails/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class", // on pilote le dark via la classe .dark sur <html>
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
