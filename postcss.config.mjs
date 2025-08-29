// postcss.config.mjs
export default {
  plugins: {
    "@tailwindcss/postcss": {},   // <─ le bon plugin pour Tailwind
    autoprefixer: {},
  },
};
