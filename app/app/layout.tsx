import type { ReactNode } from "react";
import Sidebar from "../../components/app/Sidebar";
import ThemeToggle from "../../components/app/ThemeToggle";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex">
      {/* Sidebar à gauche */}
      <Sidebar />

      {/* Contenu principal à droite */}
      <main
        className="flex-1 p-8 relative"
        style={{ marginLeft: "var(--sidebar-w, 16rem)" }} // suit l’ouverture/fermeture
      >
        {/* ✅ Toggle thème en haut à droite */}
        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        {children}
      </main>
    </div>
  );
}
