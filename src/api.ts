const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "https://cephas-crm-api.onrender.com").replace(/\/$/, "");

export type ApiContact = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
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
  createContact: (contact: Omit<ApiContact, "id" | "createdAt">) =>
    request<ApiContact>("/contacts", { method: "POST", body: JSON.stringify(contact) }),
  updateContact: (id: string, contact: Partial<ApiContact>) =>
    request<ApiContact>(`/contacts/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(contact) }),
};

export function contactFromApi(contact: ApiContact) {
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
  return {
    id: contact.id,
    name,
    email: contact.email,
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
