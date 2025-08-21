import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1E3A5F] text-white flex flex-col">
        <div className="p-4 font-bold text-xl">Relansia</div>
        <nav className="flex-1 px-2 space-y-1">
          <Link href="/app" className="block px-3 py-2 rounded hover:bg-white/10">
            Dashboard
          </Link>
          <Link href="/app/clients" className="block px-3 py-2 rounded hover:bg-white/10">
            Clients
          </Link>
          <Link href="/app/products" className="block px-3 py-2 rounded hover:bg-white/10">
            Produits
          </Link>
          <Link href="/app/reminders" className="block px-3 py-2 rounded hover:bg-white/10">
            Relances
          </Link>
          <Link href="/app/settings" className="block px-3 py-2 rounded hover:bg-white/10">
            Paramètres
          </Link>
        </nav>
      </aside>

      {/* Contenu principal */}
      <main className="flex-1 p-8 bg-[#F7F9FB]">{children}</main>
    </div>
  );
}
