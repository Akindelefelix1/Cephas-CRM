import { getAuthToken } from "./auth";

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
  whatsappConsent: "Subscribed" | "Unsubscribed" | "Pending";
  createdAt: string;
};
export type ApiCategory = { id: string; name: string };
export type ApiSettings = {
  workspace: { ownerId: string; organizationName: string; timezone: string; senderName: string; updatedAt?: string };
  integrations: {
    email: { provider: string; configured: boolean; sender: string | null };
    sms: { provider: string; configured: boolean; sender: string | null };
    whatsapp: { provider: string; configured: boolean; sender: string | null };
  };
  policies: { emailConsentRequiredForSend: boolean; smsConsentRequiredForSend: boolean; whatsappConsentRequiredForSend: boolean; importedContactsDefaultConsent: string; twoFactorManagedBy: string };
  privacyRequests: ApiPrivacyRequest[];
};
export type ApiPrivacyRequest = { id: string; requestType: "Access" | "Correction" | "Deletion"; email: string; status: string; createdAt: string };
export type ApiAuditEvent = {
  id: string;
  actorId: string;
  actorName: string;
  actorEmail: string | null;
  action: string;
  details: string;
  eventType: string;
  createdAt: string;
};
export type ApiAuditList = { items: ApiAuditEvent[]; total: number; eventTypes: string[]; limit: number; offset: number };
export type ApiAnalytics = {
  generatedAt: string;
  range: { days: number; startAt: string; endAt: string; previousStartAt: string; previousEndAt: string };
  summary: { contactsTotal: number; contactsAdded: number; contactsAddedPrevious: number; campaignsSent: number; campaignsSentPrevious: number; recipients: number; providerAccepted: number; whatsappDelivered: number; failed: number };
  consent: { email: number; sms: number; whatsapp: number };
  channels: { channel: "Email" | "SMS" | "WhatsApp"; campaignsSent: number; recipients: number; providerAccepted: number; delivered: number | null; failed: number | null; deliveryRate: number | null; deliveryTrackingAvailable: boolean }[];
  trends: { date: string; contactsAdded: number; campaignsSent: number; recipients: number; delivered: number; failed: number }[];
  campaignStatuses: { status: string; count: number }[];
  recentCampaigns: { id: string; name: string; channel: string; status: string; sentAt: string | null; recipients: number; providerAccepted: number; failed: number; trackedDelivery: number | null }[];
  engagement: { opens: number | null; clicks: number | null; unsubscribes: number | null; available: boolean; note: string };
};
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
  whatsappTemplate?: string | null;
  whatsappSender?: string | null;
  whatsappMergeInfo?: string | null;
  createdAt: string;
  updatedAt: string;
};
export type ApiCampaignInput = {
  name: string;
  channel?: "Email" | "SMS" | "WhatsApp";
  objective: string;
  subject: string;
  blocks: ApiCampaign["blocks"];
  includedAudiences: string[];
  excludedAudiences: string[];
  excludedContacts: string[];
  attachments: string[];
  whatsappTemplate?: string;
  whatsappSender?: string;
  whatsappMergeInfo?: Record<string, string>;
  scheduledAt?: string;
};
export type ApiTemplate = {
  id: string;
  name: string;
  channel: "Email" | "SMS" | "WhatsApp";
  subject: string;
  body: string;
  emailBlocks: string | NonNullable<ApiCampaignInput["blocks"]>;
  attachments: string[];
  objective: string;
  whatsappTemplate: string | null;
  whatsappSender: string | null;
  whatsappMergeInfo: string | Record<string, string>;
  isDefault: boolean;
  useCount: number;
  createdAt: string;
  updatedAt: string;
};
export type ApiTemplateInput = Omit<ApiTemplate, "id" | "isDefault" | "useCount" | "createdAt" | "updatedAt">;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAuthToken();
  if (!token) throw new Error("Please sign in again to continue.");
  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
      Authorization: `Bearer ${token}`,
    },
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
  getSettings: () => request<ApiSettings>("/settings"),
  updateSettings: (input: { organizationName: string; timezone: string; senderName: string }) =>
    request<ApiSettings["workspace"]>("/settings", { method: "PATCH", body: JSON.stringify(input) }),
  createPrivacyRequest: (input: { requestType: ApiPrivacyRequest["requestType"]; email: string }) =>
    request<ApiPrivacyRequest>("/settings/privacy-requests", { method: "POST", body: JSON.stringify(input) }),
  testZohoCampaignsConnection: () =>
    request<{ connected: boolean; provider: string }>("/campaigns/zoho/test-connection", { method: "POST" }),
  listAuditEvents: (options: { search?: string; eventType?: string; limit?: number; offset?: number } = {}) => {
    const params = new URLSearchParams();
    if (options.search) params.set("search", options.search);
    if (options.eventType && options.eventType !== "All activity") params.set("eventType", options.eventType);
    if (options.limit !== undefined) params.set("limit", String(options.limit));
    if (options.offset !== undefined) params.set("offset", String(options.offset));
    return request<ApiAuditList>(`/audit-events${params.size ? `?${params}` : ""}`);
  },
  createAuditEvent: (event: { actorName: string; actorEmail: string; action: string; details: string; eventType: string }) =>
    request<ApiAuditEvent>("/audit-events", { method: "POST", body: JSON.stringify(event) }),
  getAnalytics: (periodDays: 7 | 30 | 90) =>
    request<ApiAnalytics>(`/analytics?period=${periodDays}`),
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
  listTemplates: () => request<ApiTemplate[]>("/templates"),
  createTemplate: (template: ApiTemplateInput) =>
    request<ApiTemplate>("/templates", { method: "POST", body: JSON.stringify(template) }),
  updateTemplate: (id: string, template: ApiTemplateInput) =>
    request<ApiTemplate>(`/templates/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(template) }),
  deleteTemplate: (id: string) =>
    request<{ deleted: boolean; id: string }>(`/templates/${encodeURIComponent(id)}`, { method: "DELETE" }),
  useTemplate: (id: string) =>
    request<{ id: string; useCount: number }>(`/templates/${encodeURIComponent(id)}/use`, { method: "POST" }),
  createCampaign: (campaign: ApiCampaignInput) =>
    request<ApiCampaign>("/campaigns", {
      method: "POST",
      body: JSON.stringify(campaign),
    }),
  getSmsProviderStatus: () =>
    request<{ configured: boolean; senderId: string | null; countryCode: string; channel: string }>(
      "/campaigns/sms/provider-status",
    ),
  getWhatsAppProviderStatus: () =>
    request<{ configured: boolean; sender: string | null }>(
      "/campaigns/whatsapp/provider-status",
    ),
  refreshWhatsAppDelivery: (id: string) =>
    request<{ total: number; delivered: number; failed: number; pending: number; errors: string[]; status: string; lastError: string | null }>(
      `/campaigns/${encodeURIComponent(id)}/whatsapp-delivery`,
      { method: "POST" },
    ),
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
    whatsappStatus: contact.whatsappConsent ?? "Pending",
    initials,
    color: "lavender",
    date: new Date(contact.createdAt).toLocaleDateString(),
  };
}
