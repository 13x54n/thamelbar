"use client";

import { useEffect, useState } from "react";
import { fetchUsers } from "@/lib/api";

type User = {
  id: string;
  name: string;
  email: string;
  points: number;
  verified: boolean;
  createdAt: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsers()
      .then((data) => setUsers(data.users))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-stone-400">Loading users…</p>;
  if (error) return <p className="text-red-400">{error}</p>;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-amber-400">Users</h1>
      <p className="mb-6 text-stone-400">Members and their reward points.</p>

      <div className="overflow-hidden rounded-xl border border-stone-700">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-700 bg-stone-800/80">
            <tr>
              <th className="px-4 py-3 font-medium text-stone-300">Name</th>
              <th className="px-4 py-3 font-medium text-stone-300">Email</th>
              <th className="px-4 py-3 font-medium text-stone-300">Points</th>
              <th className="px-4 py-3 font-medium text-stone-300">Verified</th>
              <th className="px-4 py-3 font-medium text-stone-300">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                  No users yet.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-stone-800 hover:bg-stone-800/30">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-stone-300">{u.email}</td>
                  <td className="px-4 py-3 text-amber-400">{u.points ?? 0}</td>
                  <td className="px-4 py-3 text-stone-300">{u.verified ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-stone-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
