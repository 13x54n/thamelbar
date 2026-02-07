"use client";

import { useEffect, useState } from "react";
import { fetchKaraokeBookings } from "@/lib/api";

type Booking = {
  id: string;
  room: string;
  date: string;
  slot: string;
  contactNumber: string;
  user: { name: string; email: string } | null;
};

function todayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function BookingTable({
  bookings,
  emptyMessage,
}: {
  bookings: Booking[];
  emptyMessage: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-stone-700">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-stone-700 bg-stone-800/80">
          <tr>
            <th className="px-4 py-3 font-medium text-stone-300">Room</th>
            <th className="px-4 py-3 font-medium text-stone-300">Date</th>
            <th className="px-4 py-3 font-medium text-stone-300">Time</th>
            <th className="px-4 py-3 font-medium text-stone-300">Contact</th>
            <th className="px-4 py-3 font-medium text-stone-300">Member</th>
          </tr>
        </thead>
        <tbody>
          {bookings.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            bookings.map((b) => (
              <tr key={b.id} className="border-b border-stone-800 hover:bg-stone-800/30">
                <td className="px-4 py-3 font-medium">{b.room}</td>
                <td className="px-4 py-3 text-stone-300">{b.date}</td>
                <td className="px-4 py-3 text-stone-300">{b.slot}</td>
                <td className="px-4 py-3 text-stone-300">{b.contactNumber}</td>
                <td className="px-4 py-3 text-stone-300">
                  {b.user ? `${b.user.name} (${b.user.email})` : "—"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchKaraokeBookings()
      .then((data) => setBookings(data.bookings))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const today = todayDateString();
  const todayBookings = bookings.filter((b) => b.date === today);

  if (loading) return <p className="text-stone-400">Loading bookings…</p>;
  if (error) return <p className="text-red-400">{error}</p>;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-amber-400">Karaoke bookings</h1>
      <p className="mb-8 text-stone-400">All karaoke room bookings.</p>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-stone-200">
          Today&apos;s bookings
          <span className="ml-2 font-normal text-stone-500">
            ({todayBookings.length} {todayBookings.length === 1 ? "booking" : "bookings"})
          </span>
        </h2>
        <BookingTable
          bookings={todayBookings}
          emptyMessage="No bookings for today."
        />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-stone-200">
          All bookings
          <span className="ml-2 font-normal text-stone-500">
            ({bookings.length} total)
          </span>
        </h2>
        <BookingTable
          bookings={bookings}
          emptyMessage="No bookings yet."
        />
      </section>
    </div>
  );
}
