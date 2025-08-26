// components/app/nav.ts
import {
  Home,
  Users,
  Package,
  Bell,
  Settings,
} from "lucide-react";

// components/app/nav.ts
export const appNav = [
  {
    label: "Dashboard",
    href: "/app",
    icon: "LayoutDashboard", // ✅ existe dans lucide-react
  },
  {
    label: "Clients",
    href: "/app/clients",
    icon: "Users", // ✅ existe
  },
  {
    label: "Products",
    href: "/app/products",
    icon: "Package", // ✅ existe
  },
  {
    label: "Reminders",
    href: "/app/reminders",
    icon: "Bell", // ✅ existe
  },
  {
    label: "Settings",
    href: "/app/settings",
    icon: "Settings", // ✅ existe
  },
];


// Map icônes
export const icons: Record<string, any> = {
  home: Home,
  users: Users,
  package: Package,
  bell: Bell,
  settings: Settings,
};
