const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET || "";

const headers: HeadersInit = {
  "Content-Type": "application/json",
  ...(ADMIN_SECRET ? { "X-Admin-Secret": ADMIN_SECRET } : {}),
};

export type DashboardStats = {
  totalUsers: number;
  activePromos: number;
  totalAmountTransacted: number;
  totalKaraokeBookings: number;
};

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_URL}/api/admin/stats`, { headers });
  if (!res.ok) throw new Error("Failed to fetch dashboard stats");
  return res.json();
}

export async function fetchUsers(): Promise<{ users: { id: string; name: string; email: string; points: number; verified: boolean; createdAt: string }[] }> {
  const res = await fetch(`${API_URL}/api/admin/users`, { headers });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function fetchKaraokeBookings(): Promise<{
  bookings: { id: string; room: string; date: string; slot: string; contactNumber: string; user: { name: string; email: string } | null }[];
}> {
  const res = await fetch(`${API_URL}/api/admin/karaoke-bookings`, { headers });
  if (!res.ok) throw new Error("Failed to fetch bookings");
  return res.json();
}

export async function rewardUser(email: string, amount: number, offerId?: string): Promise<{
  success: boolean;
  user: { name: string; email: string; points: number };
  amount: number;
  pointsAdded: number;
  offerApplied: boolean;
}> {
  const res = await fetch(`${API_URL}/api/admin/reward`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, amount, offerId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to apply reward");
  return data;
}

export async function sendNotify(params: {
  target: "all" | "emails";
  emails?: string[];
  title: string;
  body: string;
  sendEmail: boolean;
  sendPush: boolean;
}): Promise<{ success: boolean; emailCount: number; pushCount: number; userCount: number }> {
  const res = await fetch(`${API_URL}/api/admin/notify`, {
    method: "POST",
    headers,
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to send notifications");
  return data;
}

// Promos
export type Promo = {
  id: string;
  title: string;
  detail: string;
  image: string;
  order: number;
  active: boolean;
  createdAt?: string;
};

export async function fetchPromos(): Promise<{ promos: Promo[] }> {
  const res = await fetch(`${API_URL}/api/admin/promos`, { headers });
  if (!res.ok) throw new Error("Failed to fetch promos");
  return res.json();
}

export async function createPromo(body: {
  title: string;
  detail?: string;
  image: string;
  order?: number;
  active?: boolean;
}): Promise<{ promo: Promo }> {
  const res = await fetch(`${API_URL}/api/admin/promos`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to create promo");
  return data;
}

export async function updatePromo(
  id: string,
  body: Partial<{ title: string; detail: string; image: string; order: number; active: boolean }>
): Promise<{ promo: Promo }> {
  const res = await fetch(`${API_URL}/api/admin/promos/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to update promo");
  return data;
}

export async function deletePromo(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/promos/${id}`, {
    method: "DELETE",
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Failed to delete promo");
}

// Menu categories (match frontend MENU.sections)
export type MenuCategory = { id: string; title: string };

export async function fetchMenuCategories(): Promise<{ categories: MenuCategory[] }> {
  const res = await fetch(`${API_URL}/api/menu-categories`);
  if (!res.ok) throw new Error("Failed to fetch menu categories");
  return res.json();
}

// Food menu
export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: string | number;
  image: string;
  category: string;
  order: number;
  active: boolean;
  optionGroups?: { label: string; choices: { name: string; price?: number }[]; modifier?: boolean }[];
  createdAt?: string;
};

export async function fetchMenu(): Promise<{ menu: MenuItem[] }> {
  const res = await fetch(`${API_URL}/api/admin/menu`, { headers });
  if (!res.ok) throw new Error("Failed to fetch menu");
  return res.json();
}

export type OptionGroupForm = {
  label: string;
  modifier?: boolean;
  choices: { name: string; price?: number }[];
};

export async function createMenuItem(body: {
  name: string;
  description?: string;
  price?: string | number;
  image?: string;
  category?: string;
  order?: number;
  active?: boolean;
  optionGroups?: OptionGroupForm[];
}): Promise<{ menuItem: MenuItem }> {
  const res = await fetch(`${API_URL}/api/admin/menu`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to create menu item");
  return data;
}

export async function updateMenuItem(
  id: string,
  body: Partial<{
    name: string;
    description: string;
    price: string | number;
    image: string;
    category: string;
    order: number;
    active: boolean;
    optionGroups: OptionGroupForm[];
  }>
): Promise<{ menuItem: MenuItem }> {
  const res = await fetch(`${API_URL}/api/admin/menu/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to update menu item");
  return data;
}

export async function deleteMenuItem(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/menu/${id}`, {
    method: "DELETE",
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Failed to delete menu item");
}
