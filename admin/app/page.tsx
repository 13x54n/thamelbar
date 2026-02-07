"use client";

import { fetchDashboardStats } from "@/lib/api";
import { Users, Megaphone, DollarSign, CalendarDays } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [stats, setStats] = useState<{
    totalUsers: number;
    activePromos: number;
    totalAmountTransacted: number;
    totalKaraokeBookings: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      label: "Total users",
      value: stats?.totalUsers ?? "—",
      href: "/users",
      icon: Users,
      description: "Registered members",
    },
    {
      label: "Active promos",
      value: stats?.activePromos ?? "—",
      href: "/promos",
      icon: Megaphone,
      description: "Live in app",
    },
    {
      label: "Money transacted",
      value:
        stats?.totalAmountTransacted != null
          ? `$${stats.totalAmountTransacted.toLocaleString("en-CA", { minimumFractionDigits: 2 })}`
          : "—",
      href: "/scan",
      icon: DollarSign,
      description: "Bill amount (points earned)",
    },
    {
      label: "Karaoke bookings",
      value: stats?.totalKaraokeBookings ?? "—",
      href: "/bookings",
      icon: CalendarDays,
      description: "Total bookings",
    },
  ];

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-amber-400">Dashboard</h1>
      <p className="mb-8 text-stone-400">Manage rewards, offers, and bookings.</p>

      {error && (
        <p className="mb-4 rounded-lg border border-red-800 bg-red-950/50 px-4 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-xl border border-stone-700 bg-stone-900/50 p-5 transition hover:border-amber-500/50 hover:bg-stone-800/50"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-400">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold text-white tabular-nums">
                    {loading ? "…" : card.value}
                  </p>
                  <p className="mt-0.5 text-xs text-stone-500">{card.description}</p>
                </div>
                <div className="rounded-lg bg-stone-800 p-2">
                  <Icon className="h-5 w-5 text-amber-400" strokeWidth={1.8} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <h2 className="mb-4 text-lg font-semibold text-stone-200">Quick actions</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/scan"
          className="rounded-xl border border-stone-700 bg-stone-900/50 p-6 transition hover:border-amber-500/50 hover:bg-stone-800/50"
        >
          <h2 className="text-lg font-semibold text-white">Scan QR</h2>
          <p className="mt-1 text-sm text-stone-400">
            Scan member QR to add reward points or apply offers.
          </p>
        </Link>
        <Link
          href="/bookings"
          className="rounded-xl border border-stone-700 bg-stone-900/50 p-6 transition hover:border-amber-500/50 hover:bg-stone-800/50"
        >
          <h2 className="text-lg font-semibold text-white">Karaoke bookings</h2>
          <p className="mt-1 text-sm text-stone-400">
            View and manage karaoke room bookings.
          </p>
        </Link>
        <Link
          href="/users"
          className="rounded-xl border border-stone-700 bg-stone-900/50 p-6 transition hover:border-amber-500/50 hover:bg-stone-800/50"
        >
          <h2 className="text-lg font-semibold text-white">Users</h2>
          <p className="mt-1 text-sm text-stone-400">
            List members and their points.
          </p>
        </Link>
        <Link
          href="/promos"
          className="rounded-xl border border-stone-700 bg-stone-900/50 p-6 transition hover:border-amber-500/50 hover:bg-stone-800/50"
        >
          <h2 className="text-lg font-semibold text-white">Promos</h2>
          <p className="mt-1 text-sm text-stone-400">
            Add, edit, and remove promos shown in the mobile app.
          </p>
        </Link>
        <Link
          href="/menu"
          className="rounded-xl border border-stone-700 bg-stone-900/50 p-6 transition hover:border-amber-500/50 hover:bg-stone-800/50"
        >
          <h2 className="text-lg font-semibold text-white">Food menu</h2>
          <p className="mt-1 text-sm text-stone-400">
            Add, edit, and remove food menu items in the app.
          </p>
        </Link>
        <Link
          href="/notify"
          className="rounded-xl border border-stone-700 bg-stone-900/50 p-6 transition hover:border-amber-500/50 hover:bg-stone-800/50"
        >
          <h2 className="text-lg font-semibold text-white">Notify</h2>
          <p className="mt-1 text-sm text-stone-400">
            Send email and push notifications to users.
          </p>
        </Link>
      </div>
    </div>
  );
}
