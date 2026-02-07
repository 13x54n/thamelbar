"use client";

import { useEffect, useState } from "react";
import {
  fetchPromos,
  createPromo,
  updatePromo,
  deletePromo,
  type Promo,
} from "@/lib/api";
export default function PromosPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Promo | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    detail: "",
    image: "",
    order: 0,
    active: true,
  });

  const load = () => {
    setLoading(true);
    setError("");
    fetchPromos()
      .then((data) => setPromos(data.promos))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setAdding(true);
    setEditing(null);
    setForm({ title: "", detail: "", image: "", order: 0, active: true });
  };

  const openEdit = (p: Promo) => {
    setEditing(p);
    setAdding(false);
    setForm({
      title: p.title,
      detail: p.detail,
      image: p.image,
      order: p.order ?? 0,
      active: p.active !== false,
    });
  };

  const closeForm = () => {
    setAdding(false);
    setEditing(null);
  };

  const save = async () => {
    if (!form.title.trim() || !form.image.trim()) {
      setError("Title and image are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await updatePromo(editing.id, form);
      } else {
        await createPromo(form);
      }
      closeForm();
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this promo from the app?")) return;
    setError("");
    try {
      await deletePromo(id);
      load();
      closeForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const showForm = adding || editing;

  if (loading) return <p className="text-stone-400">Loading promos…</p>;
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-amber-400">Promos</h1>
        <p className="mt-1 text-stone-400">Manage promos shown in the mobile app.</p>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-800 bg-red-950/50 px-4 py-2 text-red-300">
          {error}
        </p>
      )}

      <div className="mb-4">
        <button
          type="button"
          onClick={openAdd}
          className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-amber-400 transition hover:bg-amber-500/20"
        >
          + Add promo
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-stone-700">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-700 bg-stone-800/80">
            <tr>
              <th className="px-4 py-3 font-medium text-stone-300">Image</th>
              <th className="px-4 py-3 font-medium text-stone-300">Title</th>
              <th className="px-4 py-3 font-medium text-stone-300">Detail</th>
              <th className="px-4 py-3 font-medium text-stone-300">Order</th>
              <th className="px-4 py-3 font-medium text-stone-300">Active</th>
              <th className="px-4 py-3 font-medium text-stone-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {promos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-stone-500">
                  No promos yet. Add one to show in the app.
                </td>
              </tr>
            ) : (
              promos.map((p) => (
                <tr key={p.id} className="border-b border-stone-800 hover:bg-stone-800/30">
                  <td className="px-4 py-3">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt=""
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <span className="text-stone-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{p.title}</td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-stone-400">
                    {p.detail || "—"}
                  </td>
                  <td className="px-4 py-3 text-stone-400">{p.order ?? 0}</td>
                  <td className="px-4 py-3">{p.active !== false ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="mr-2 text-amber-400 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(p.id)}
                      className="text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-stone-700 bg-stone-900 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              {editing ? "Edit promo" : "Add promo"}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm text-stone-400">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded border border-stone-600 bg-stone-800 px-3 py-2 text-white"
                  placeholder="e.g. 500 pts = $10 off"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-stone-400">Detail</label>
                <input
                  type="text"
                  value={form.detail}
                  onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))}
                  className="w-full rounded border border-stone-600 bg-stone-800 px-3 py-2 text-white"
                  placeholder="Short description"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-stone-400">Image URL *</label>
                <input
                  type="url"
                  value={form.image}
                  onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                  className="w-full rounded border border-stone-600 bg-stone-800 px-3 py-2 text-white"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-stone-400">Order</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm((f) => ({ ...f, order: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full rounded border border-stone-600 bg-stone-800 px-3 py-2 text-white"
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                  className="rounded border-stone-600"
                />
                <span className="text-sm text-stone-300">Active (show in app)</span>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeForm}
                className="rounded border border-stone-600 px-4 py-2 text-stone-300 hover:bg-stone-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="rounded bg-amber-500 px-4 py-2 text-stone-900 disabled:opacity-50"
              >
                {saving ? "Saving…" : editing ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
