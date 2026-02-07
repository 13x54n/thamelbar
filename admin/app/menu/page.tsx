"use client";

import { useEffect, useState } from "react";
import {
  fetchMenu,
  fetchMenuCategories,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  type MenuItem,
  type MenuCategory,
  type OptionGroupForm,
} from "@/lib/api";

function defaultOptionGroup(): OptionGroupForm {
  return { label: "", modifier: false, choices: [{ name: "" }] };
}

function defaultChoice(): { name: string; price?: number } {
  return { name: "" };
}

export default function MenuPage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [form, setForm] = useState<{
    name: string;
    description: string;
    price: string | number;
    image: string;
    category: string;
    order: number;
    active: boolean;
    optionGroups: OptionGroupForm[];
  }>({
    name: "",
    description: "",
    price: "",
    image: "",
    category: "starters",
    order: 0,
    active: true,
    optionGroups: [],
  });

  const load = () => {
    setLoading(true);
    setError("");
    fetchMenu()
      .then((data) => setMenu(data.menu))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    fetchMenuCategories()
      .then((data) => setCategories(data.categories))
      .catch(() => setCategories([]));
  }, []);

  const openAdd = () => {
    setAdding(true);
    setEditing(null);
    setForm({
      name: "",
      description: "",
      price: "",
      image: "",
      category: categories[0]?.id ?? "starters",
      order: 0,
      active: true,
      optionGroups: [],
    });
  };

  const openEdit = (m: MenuItem) => {
    setEditing(m);
    setAdding(false);
    const groups: OptionGroupForm[] = (m.optionGroups ?? []).map((g) => ({
      label: g.label,
      modifier: g.modifier ?? false,
      choices: (g.choices ?? []).length ? g.choices : [{ name: "" }],
    }));
    setForm({
      name: m.name,
      description: m.description ?? "",
      price: m.price ?? "",
      image: m.image ?? "",
      category: m.category ?? "starters",
      order: m.order ?? 0,
      active: m.active !== false,
      optionGroups: groups,
    });
  };

  const setOptionGroups = (updater: (prev: OptionGroupForm[]) => OptionGroupForm[]) => {
    setForm((f) => ({ ...f, optionGroups: updater(f.optionGroups) }));
  };

  const addOptionGroup = () => {
    setOptionGroups((prev) => [...prev, defaultOptionGroup()]);
  };

  const removeOptionGroup = (groupIndex: number) => {
    setOptionGroups((prev) => prev.filter((_, i) => i !== groupIndex));
  };

  const updateOptionGroup = (groupIndex: number, updates: Partial<OptionGroupForm>) => {
    setOptionGroups((prev) =>
      prev.map((g, i) => (i === groupIndex ? { ...g, ...updates } : g))
    );
  };

  const addChoice = (groupIndex: number) => {
    setOptionGroups((prev) =>
      prev.map((g, i) =>
        i === groupIndex ? { ...g, choices: [...g.choices, defaultChoice()] } : g
      )
    );
  };

  const removeChoice = (groupIndex: number, choiceIndex: number) => {
    setOptionGroups((prev) =>
      prev.map((g, i) =>
        i === groupIndex
          ? { ...g, choices: g.choices.filter((_, j) => j !== choiceIndex) }
          : g
      )
    );
  };

  const updateChoice = (
    groupIndex: number,
    choiceIndex: number,
    updates: Partial<{ name: string; price: number | undefined }>
  ) => {
    setOptionGroups((prev) =>
      prev.map((g, i) =>
        i === groupIndex
          ? {
              ...g,
              choices: g.choices.map((c, j) =>
                j === choiceIndex ? { ...c, ...updates } : c
              ),
            }
          : g
      )
    );
  };

  const closeForm = () => {
    setAdding(false);
    setEditing(null);
  };

  const save = async () => {
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const normalizedGroups: OptionGroupForm[] = form.optionGroups
        .filter((g) => g.label.trim())
        .map((g) => ({
          label: g.label.trim(),
          modifier: g.modifier ?? false,
          choices: g.choices
            .filter((c) => c.name.trim())
            .map((c) => ({
              name: c.name.trim(),
              price: c.price != null && c.price !== "" ? Number(c.price) : undefined,
            })),
        }))
        .filter((g) => g.choices.length > 0);
      const payload = {
        ...form,
        price: form.price === "" || form.price == null ? undefined : (typeof form.price === "number" ? form.price : Number(form.price)),
        optionGroups: normalizedGroups,
      };
      if (editing) {
        await updateMenuItem(editing.id, payload);
      } else {
        await createMenuItem(payload);
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
    if (!confirm("Remove this item from the food menu?")) return;
    setError("");
    try {
      await deleteMenuItem(id);
      load();
      closeForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const showForm = adding || editing;

  if (loading) return <p className="text-stone-400">Loading menu…</p>;
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-amber-400">Food menu</h1>
        <p className="mt-1 text-stone-400">Manage food menu items shown in the mobile app.</p>
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
          + Add menu item
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-stone-700">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-700 bg-stone-800/80">
            <tr>
              <th className="w-12 px-4 py-3 font-medium text-stone-300">S.N.</th>
              <th className="px-4 py-3 font-medium text-stone-300">Name</th>
              <th className="px-4 py-3 font-medium text-stone-300">Description</th>
              <th className="px-4 py-3 font-medium text-stone-300">Price</th>
              <th className="px-4 py-3 font-medium text-stone-300">Category</th>
              <th className="px-4 py-3 font-medium text-stone-300">Options</th>
              <th className="px-4 py-3 font-medium text-stone-300">Order</th>
              <th className="px-4 py-3 font-medium text-stone-300">Active</th>
              <th className="px-4 py-3 font-medium text-stone-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {menu.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-stone-500">
                  No menu items yet. Add one to show in the app.
                </td>
              </tr>
            ) : (
              menu.map((m, index) => (
                <tr key={m.id} className="border-b border-stone-800 hover:bg-stone-800/30">
                  <td className="px-4 py-3 text-stone-400 tabular-nums">{index + 1}</td>
                  <td className="px-4 py-3 font-medium">{m.name}</td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-stone-400">
                    {m.description || "—"}
                  </td>
                  <td className="px-4 py-3 text-amber-400">
                    {m.price !== "" && m.price != null ? (typeof m.price === "number" ? `$${m.price}` : m.price) : "—"}
                  </td>
                  <td className="px-4 py-3 text-stone-400">
                    {categories.find((c) => c.id === m.category)?.title ?? m.category ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-stone-400">
                    {m.optionGroups?.length ? `${m.optionGroups.length} group(s)` : "—"}
                  </td>
                  <td className="px-4 py-3 text-stone-400">{m.order ?? 0}</td>
                  <td className="px-4 py-3">{m.active !== false ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openEdit(m)}
                      className="mr-2 text-amber-400 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(m.id)}
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
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-stone-700 bg-stone-900 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              {editing ? "Edit menu item" : "Add menu item"}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm text-stone-400">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded border border-stone-600 bg-stone-800 px-3 py-2 text-white"
                  placeholder="e.g. Momo Platter"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-stone-400">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded border border-stone-600 bg-stone-800 px-3 py-2 text-white"
                  placeholder="Short description"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-stone-400">Price</label>
                <input
                  type="text"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="w-full rounded border border-stone-600 bg-stone-800 px-3 py-2 text-white"
                  placeholder="e.g. $12.99"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-stone-400">Image URL</label>
                <input
                  type="url"
                  value={form.image}
                  onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                  className="w-full rounded border border-stone-600 bg-stone-800 px-3 py-2 text-white"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-stone-400">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full rounded border border-stone-600 bg-stone-800 px-3 py-2 text-white"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.title}
                    </option>
                  ))}
                  {categories.length === 0 && (
                    <option value="starters">Starters</option>
                  )}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-stone-400">Order</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, order: parseInt(e.target.value, 10) || 0 }))
                  }
                  className="w-full rounded border border-stone-600 bg-stone-800 px-3 py-2 text-white"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm text-stone-400">Option groups</label>
                  <button
                    type="button"
                    onClick={addOptionGroup}
                    className="text-xs text-amber-400 hover:underline"
                  >
                    + Add group
                  </button>
                </div>
                {form.optionGroups.length === 0 ? (
                  <p className="rounded border border-dashed border-stone-600 px-3 py-2 text-sm text-stone-500">
                    No option groups. Add one for choices (e.g. Spice Level, Protein options).
                  </p>
                ) : (
                  <div className="space-y-4 rounded border border-stone-600 bg-stone-800/50 p-3">
                    {form.optionGroups.map((group, gi) => (
                      <div key={gi} className="rounded border border-stone-600 bg-stone-800 p-3">
                        <div className="mb-2 flex gap-2">
                          <input
                            type="text"
                            value={group.label}
                            onChange={(e) =>
                              updateOptionGroup(gi, { label: e.target.value })
                            }
                            className="flex-1 rounded border border-stone-600 bg-stone-900 px-2 py-1.5 text-sm text-white"
                            placeholder="Group label (e.g. Spice Level)"
                          />
                          <button
                            type="button"
                            onClick={() => removeOptionGroup(gi)}
                            className="shrink-0 text-red-400 hover:underline"
                            title="Remove group"
                          >
                            Remove
                          </button>
                        </div>
                        <label className="mb-1.5 flex items-center gap-2 text-xs text-stone-400">
                          <input
                            type="checkbox"
                            checked={group.modifier ?? false}
                            onChange={(e) =>
                              updateOptionGroup(gi, { modifier: e.target.checked })
                            }
                            className="rounded border-stone-600"
                          />
                          Modifier (e.g. protein add-on)
                        </label>
                        <div className="mt-2 space-y-1.5">
                          {group.choices.map((choice, ci) => (
                            <div key={ci} className="flex gap-2">
                              <input
                                type="text"
                                value={choice.name}
                                onChange={(e) =>
                                  updateChoice(gi, ci, { name: e.target.value })
                                }
                                className="flex-1 rounded border border-stone-600 bg-stone-900 px-2 py-1.5 text-sm text-white"
                                placeholder="Choice name"
                              />
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={choice.price ?? ""}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  updateChoice(gi, ci, {
                                    price: v === "" ? undefined : Number(v),
                                  });
                                }}
                                className="w-20 rounded border border-stone-600 bg-stone-900 px-2 py-1.5 text-sm text-white"
                                placeholder="Price"
                              />
                              <button
                                type="button"
                                onClick={() => removeChoice(gi, ci)}
                                className="shrink-0 text-stone-500 hover:text-red-400"
                                title="Remove choice"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addChoice(gi)}
                            className="text-xs text-amber-400 hover:underline"
                          >
                            + Add choice
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
