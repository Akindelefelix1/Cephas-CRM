const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "https://cephas-crm-api.onrender.com"
).replace(/\/$/, "");

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
  createdAt: string;
  updatedAt: string;
};
export type ApiAudienceDetail = ApiAudience & {
  rules: Array<{ field: string; operator: string; value: string }>;
  members: { contact: ApiContact; addedAt: string | null }[];
};
export type ApiAudienceInput = {
  name: string;
  type: "static" | "dynamic";
  description: string;
  rules: Array<{ field: string; operator: string; value: string }>;
  contactIds?: string[];
};
export type ApiCampaign = {
  id: string;
  name: string;
  channel: "Email" | "SMS" | "WhatsApp";
  status: string;
  objective: string;
  subject: string;
  blocks:
    | string
    | {
        id: string;
        type: "text" | "image" | "link" | "button" | "divider";
        content: string;
        url?: string;
      }[];
  includedAudiences: string[];
  excludedAudiences: string[];
  excludedContacts: string[];
  attachmentNames: string[];
  scheduledAt: string | null;
  sentAt: string | null;
  recipientCount: number;
  deliveredCount: number;
  failedCount: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};
export type ApiCampaignInput = {
  name: string;
  objective: string;
  subject: string;
  blocks: ApiCampaign["blocks"];
  includedAudiences: string[];
  excludedAudiences: string[];
  excludedContacts: string[];
  attachments: string[];
  scheduledAt?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    let message = detail;
    try {
      const parsed = JSON.parse(detail) as {
        message?: unknown;
        error?: unknown;
      };
      if (Array.isArray(parsed.message)) message = parsed.message.join(" ");
      else if (typeof parsed.message === "string") message = parsed.message;
      else if (typeof parsed.error === "string") message = parsed.error;
    } catch {
      // Keep plain-text API responses readable as-is.
    }
    throw new Error(message || `API request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export const crmApi = {
  listContacts: () => request<ApiContact[]>("/contacts"),
  importContacts: (contacts: Omit<ApiContact, "id" | "createdAt">[]) =>
    request<{ contacts: ApiContact[]; created: number; skipped: number }>(
      "/contacts/bulk",
      { method: "POST", body: JSON.stringify({ contacts }) },
    ),
  deleteContact: (id: string) =>
    request<{ deleted: boolean; id: string }>(
      `/contacts/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    ),
  deleteContacts: (contactIds: string[]) =>
    request<{ deleted: number; ids: string[] }>("/contacts/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ contactIds }),
    }),
  createContact: (contact: Omit<ApiContact, "id" | "createdAt">) =>
    request<ApiContact>("/contacts", {
      method: "POST",
      body: JSON.stringify(contact),
    }),
  updateContact: (id: string, contact: Partial<ApiContact>) =>
    request<ApiContact>(`/contacts/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(contact),
    }),
  sendContactEmail: (id: string, email: { subject: string; body: string }) =>
    request<{ sent: boolean; to: string }>(
      `/contacts/${encodeURIComponent(id)}/email`,
      { method: "POST", body: JSON.stringify(email) },
    ),
  mergeContact: (
    targetId: string,
    sourceId: string | undefined,
    contact: Partial<ApiContact>,
  ) =>
    request<ApiContact>(`/contacts/${encodeURIComponent(targetId)}/merge`, {
      method: "POST",
      body: JSON.stringify({ ...contact, sourceId }),
    }),
  listCategories: async () =>
    (await request<ApiCategory[]>("/categories")).map(
      (category) => category.name,
    ),
  createCategory: (name: string) =>
    request<ApiCategory>("/categories", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  renameCategory: (previousName: string, name: string) =>
    request<ApiCategory>(`/categories/${encodeURIComponent(previousName)}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    }),
  deleteCategory: (name: string, fallbackName: string) =>
    request<{
      deleted: boolean;
      name: string;
      movedContacts: number;
      fallback: string;
    }>(`/categories/${encodeURIComponent(name)}`, {
      method: "DELETE",
      body: JSON.stringify({ fallbackName }),
    }),
  listAudiences: () => request<ApiAudience[]>("/audiences"),
  getAudience: (id: string) =>
    request<ApiAudienceDetail>(`/audiences/${encodeURIComponent(id)}`),
  createAudience: (audience: ApiAudienceInput) =>
    request<ApiAudience>("/audiences", {
      method: "POST",
      body: JSON.stringify(audience),
    }),
  updateAudience: (id: string, audience: Partial<ApiAudienceInput>) =>
    request<ApiAudience>(`/audiences/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(audience),
    }),
  deleteAudience: (id: string) =>
    request<{ deleted: boolean; id: string }>(
      `/audiences/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    ),
  addAudienceMembers: (id: string, contactIds: string[]) =>
    request<{ added: number }>(`/audiences/${encodeURIComponent(id)}/members`, {
      method: "POST",
      body: JSON.stringify({ contactIds }),
    }),
  removeAudienceMember: (id: string, contactId: string) =>
    request<{ removed: boolean; contactId: string }>(
      `/audiences/${encodeURIComponent(id)}/members/${encodeURIComponent(contactId)}`,
      { method: "DELETE" },
    ),
  listCampaigns: () => request<ApiCampaign[]>("/campaigns"),
  createCampaign: (campaign: ApiCampaignInput) =>
    request<ApiCampaign>("/campaigns", {
      method: "POST",
      body: JSON.stringify(campaign),
    }),
  updateCampaign: (id: string, campaign: ApiCampaignInput) =>
    request<ApiCampaign>(`/campaigns/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(campaign),
    }),
  requestCampaignApproval: (id: string) =>
    request<ApiCampaign>(
      `/campaigns/${encodeURIComponent(id)}/request-approval`,
      { method: "POST" },
    ),
  approveCampaign: (id: string) =>
    request<ApiCampaign>(`/campaigns/${encodeURIComponent(id)}/approve`, {
      method: "POST",
    }),
  scheduleCampaign: (id: string) =>
    request<ApiCampaign>(`/campaigns/${encodeURIComponent(id)}/schedule`, {
      method: "POST",
    }),
  sendCampaign: (id: string) =>
    request<
      ApiCampaign & {
        delivery: {
          total: number;
          sent: number;
          failed: number;
          errors: string[];
        };
      }
    >(`/campaigns/${encodeURIComponent(id)}/send`, { method: "POST" }),
  sendCampaignTest: (
    to: string,
    subject: string,
    blocks: NonNullable<ApiCampaignInput["blocks"]>,
  ) =>
    request<{ sent: boolean; to: string }>("/campaigns/test", {
      method: "POST",
      body: JSON.stringify({ to, subject, blocks }),
    }),
  cancelCampaign: (id: string) =>
    request<ApiCampaign>(`/campaigns/${encodeURIComponent(id)}/cancel`, {
      method: "POST",
    }),
  pauseCampaign: (id: string, paused: boolean) =>
    request<ApiCampaign>(`/campaigns/${encodeURIComponent(id)}/pause`, {
      method: "PATCH",
      body: JSON.stringify({ paused }),
    }),
};

export function contactFromApi(contact: ApiContact) {
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
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
