"use client";

import {
  LayoutDashboard,
  ScanLine,
  Mic2,
  Users,
  Megaphone,
  UtensilsCrossed,
  Bell,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/scan", label: "Scan QR", icon: ScanLine },
  { href: "/bookings", label: "Karaoke", icon: Mic2 },
  { href: "/users", label: "Users", icon: Users },
  { href: "/promos", label: "Promos", icon: Megaphone },
  { href: "/menu", label: "Food menu", icon: UtensilsCrossed },
  { href: "/notify", label: "Notify", icon: Bell },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 border-r border-stone-800 bg-stone-900/95">
      <div className="flex h-full flex-col">
        <div className="flex h-14 shrink-0 items-center border-b border-stone-800 px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-amber-400">
            <span className="text-lg">Thamel Admin</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-amber-500/15 text-amber-400"
                    : "text-stone-400 hover:bg-stone-800 hover:text-stone-100"
                }`}
              >
                <Icon
                  className="h-5 w-5 shrink-0"
                  strokeWidth={1.8}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
