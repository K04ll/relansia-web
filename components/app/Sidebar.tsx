"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { appNav } from "./nav";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

const EXPANDED_PX = 256; // 16rem
const COLLAPSED_PX = 64; // 4rem

export default function Sidebar() {
  const pathname = usePathname();
  const prefersReduced = useReducedMotion();

  // état hover (auto expand au survol)
  const [hovering, setHovering] = useState(false);
  const effectiveExpanded = hovering;

  // met à jour la largeur pour le layout de droite
  useEffect(() => {
    const w = effectiveExpanded ? `${EXPANDED_PX}px` : `${COLLAPSED_PX}px`;
    document.documentElement.style.setProperty("--sidebar-w", w);
  }, [effectiveExpanded]);

  return (
    <motion.aside
      initial={false}
      animate={{ width: effectiveExpanded ? EXPANDED_PX : COLLAPSED_PX }}
      transition={{ duration: prefersReduced ? 0 : 0.3, ease: "easeInOut" }}
      className="fixed left-0 top-0 z-40 h-screen
                 border-r border-white/10 bg-white/5 dark:bg-black/20
                 backdrop-blur-xl"
      aria-label="Navigation principale"
      aria-expanded={effectiveExpanded}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Header */}
      <div className="flex h-16 items-center border-b border-white/10 px-3">
        <span className="text-lg font-semibold tracking-tight text-[--foreground] mx-auto">
          {effectiveExpanded ? "Relansia" : "R"}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col p-2 gap-1">
        {appNav.map((item) => {
          const Icon = (Icons[item.icon as keyof typeof Icons] || Icons.Circle) as LucideIcon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              title={effectiveExpanded ? undefined : item.label}
              className="block"
            >
              <motion.div
                initial={false}
                whileHover={prefersReduced ? undefined : { scale: 1.04, y: -1 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                style={{ transformOrigin: "left center" }}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm
                            transform-gpu will-change-transform
                            transition-colors duration-200 ease-[var(--easing)]
                            ${active
                              ? "bg-[--primary]/10 text-[--primary] font-medium"
                              : "text-[--text-dim] hover:bg-white/5 hover:text-[--foreground]"}
                            ${effectiveExpanded ? "" : "justify-center"}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {effectiveExpanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>
    </motion.aside>
  );
}
