"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Lire le thème sauvegardé au montage
  useEffect(() => {
    const saved = (localStorage.getItem("theme") as "light" | "dark") || "light";
    apply(saved);
    setTheme(saved);
  }, []);

  // Appliquer le thème au <html>
  function apply(next: "light" | "dark") {
    const html = document.documentElement;
    if (next === "dark") html.setAttribute("data-theme", "dark");
    else html.removeAttribute("data-theme");
    html.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
  }

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    apply(next);
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[--border] bg-white/10 dark:bg-black/20 hover:bg-white/20 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ring]"
      aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
      title={theme === "dark" ? "Mode clair" : "Mode sombre"}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-yellow-400" />
      ) : (
        <Moon className="h-5 w-5 text-blue-400" />
      )}
    </button>
  );
}
