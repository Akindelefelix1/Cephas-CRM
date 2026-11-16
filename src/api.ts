const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "https://cephas-crm-api.onrender.com").replace(/\/$/, "");

export type ApiContact = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  alternateEmails: string[] | null;
  phone: string | null;
  organization: string | null;
  category: string | null;
  location: string | null;
  interests: string[] | null;
  tags: string[] | null;
  emailConsent: "Subscribed" | "Unsubscribed" | "Pending";
  smsConsent: "Subscribed" | "Unsubscribed" | "Pending";
  createdAt: string;
};
export type ApiCategory = { id: string; name: string };
export type ApiAudience = {
  id: string;
  name: string;
  type: "static" | "dynamic";
  description: string | null;
  rules: string | Array<{ field: string; operator: string; value: string }>;
  memberCount: number;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || `API request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export const crmApi = {
  listContacts: () => request<ApiContact[]>("/contacts"),
  importContacts: (contacts: Omit<ApiContact, "id" | "createdAt">[]) =>
    request<{ contacts: ApiContact[]; created: number; skipped: number }>("/contacts/bulk", { method: "POST", body: JSON.stringify({ contacts }) }),
  deleteContact: (id: string) =>
    request<{ deleted: boolean; id: string }>(`/contacts/${encodeURIComponent(id)}`, { method: "DELETE" }),
  deleteContacts: (contactIds: string[]) =>
    request<{ deleted: number; ids: string[] }>("/contacts/bulk-delete", { method: "POST", body: JSON.stringify({ contactIds }) }),
  createContact: (contact: Omit<ApiContact, "id" | "createdAt">) =>
    request<ApiContact>("/contacts", { method: "POST", body: JSON.stringify(contact) }),
  updateContact: (id: string, contact: Partial<ApiContact>) =>
    request<ApiContact>(`/contacts/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(contact) }),
  mergeContact: (targetId: string, sourceId: string | undefined, contact: Partial<ApiContact>) =>
    request<ApiContact>(`/contacts/${encodeURIComponent(targetId)}/merge`, { method: "POST", body: JSON.stringify({ ...contact, sourceId }) }),
  listCategories: async () => (await request<ApiCategory[]>("/categories")).map((category) => category.name),
  createCategory: (name: string) =>
    request<ApiCategory>("/categories", { method: "POST", body: JSON.stringify({ name }) }),
  renameCategory: (previousName: string, name: string) =>
    request<ApiCategory>(`/categories/${encodeURIComponent(previousName)}`, { method: "PATCH", body: JSON.stringify({ name }) }),
  deleteCategory: (name: string, fallbackName: string) =>
    request<{ deleted: boolean; name: string; movedContacts: number; fallback: string }>(`/categories/${encodeURIComponent(name)}`, { method: "DELETE", body: JSON.stringify({ fallbackName }) }),
  listAudiences: () => request<ApiAudience[]>("/audiences"),
  getAudience: (id: string) => request<ApiAudience & { members: { contact: ApiContact }[] }>(`/audiences/${encodeURIComponent(id)}`),
  createAudience: (audience: { name: string; type: "static" | "dynamic"; description: string; rules: Array<{ field: string; operator: string; value: string }>; contactIds?: string[] }) =>
    request<ApiAudience>("/audiences", { method: "POST", body: JSON.stringify(audience) }),
  addAudienceMembers: (id: string, contactIds: string[]) =>
    request<{ added: number }>(`/audiences/${encodeURIComponent(id)}/members`, { method: "POST", body: JSON.stringify({ contactIds }) }),
};

export function contactFromApi(contact: ApiContact) {
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
  return {
    id: contact.id,
    name,
    email: contact.email,
    alternateEmails: contact.alternateEmails ?? [],
    phone: contact.phone || undefined,
    organization: contact.organization || undefined,
    category: contact.category || "Uncategorized",
    location: contact.location || "Not provided",
    interests: contact.interests ?? [],
    tags: contact.tags ?? [],
    status: contact.emailConsent,
    smsStatus: contact.smsConsent,
    initials,
    color: "lavender",
    date: new Date(contact.createdAt).toLocaleDateString(),
  };
}
