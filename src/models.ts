import type { ApiAudience, ApiAudienceDetail, ApiCampaign } from "./api";
export type Page =
  | "Dashboard"
  | "Contacts"
  | "Categories"
  | "Contact profile"
  | "Audiences"
  | "Audience profile"
  | "Help centre"
  | "Notifications"
  | "Email campaigns"
  | "Bulk SMS"
  | "WhatsApp"
  | "Templates"
  | "Scheduled"
  | "Reports"
  | "Audit log"
  | "Settings"
  | "Leads";
export type Contact = {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  category: string;
  location: string;
  interests?: string[];
  tags?: string[];
  alternateEmails?: string[];
  status: "Subscribed" | "Unsubscribed" | "Pending";
  smsStatus?: "Subscribed" | "Unsubscribed" | "Pending";
  initials: string;
  color: string;
  date: string;
};
export type EmailBlock = {
  id: string;
  type: "text" | "image" | "link" | "button" | "divider";
  content: string;
  url?: string;
};
export type Campaign = {
  id?: string;
  name: string;
  channel: "Email" | "SMS" | "WhatsApp";
  audience: string;
  status: string;
  reach: string;
  engagement: string;
  date: string;
  tone: string;
  objective?: string;
  message?: string;
  scheduledAt?: string;
  emailBlocks?: EmailBlock[];
  attachments?: string[];
  includedAudiences?: string[];
  excludedAudiences?: string[];
  excludedContacts?: string[];
  lastError?: string | null;
};
export type AuditEvent = [string, string, string, string, string, string];
export type FilterRule = { field: string; operator: string; value: string };
export type TeamRole =
  "Superadmin" | "Admin" | "Campaign Approver" | "Marketing Staff" | "Viewer";
export type PermissionId =
  | "contacts.view"
  | "contacts.create"
  | "contacts.edit"
  | "contacts.delete"
  | "contacts.export"
  | "audiences.view"
  | "audiences.manage"
  | "campaigns.view"
  | "campaigns.create"
  | "campaigns.approve"
  | "campaigns.send"
  | "templates.manage"
  | "reports.view"
  | "reports.export"
  | "categories.manage"
  | "team.manage"
  | "settings.manage";
export type TeamUser = {
  name: string;
  email: string;
  role: TeamRole;
  permissions: PermissionId[];
};
export type TemplateDraft = {
  name: string;
  channel: "Email" | "SMS" | "WhatsApp";
  subject: string;
  body: string;
  emailBlocks?: EmailBlock[];
  attachments?: string[];
  objective?: string;
  excludedAudiences?: string[];
  excludedContacts?: string[];
};
export type AudienceRecord = {
  id: string;
  name: string;
  type: "Dynamic segment" | "Static group";
  description: string;
  count: string;
  updated: string;
  tone: string;
  rules: FilterRule[];
  members: Contact[];
};
export type AudienceDraft = {
  id: string;
  name: string;
  type: "Dynamic segment" | "Static group";
  description: string;
  rules: FilterRule[];
  members: Contact[];
  memberCount?: number;
  updatedAt: string;
};
export const campaignFromApi = (row: ApiCampaign): Campaign => {
  let emailBlocks: EmailBlock[] = [];
  try {
    emailBlocks =
      typeof row.blocks === "string"
        ? (JSON.parse(row.blocks) as EmailBlock[])
        : row.blocks;
  } catch {
    emailBlocks = [];
  }
  const message =
    "Subject: " +
    row.subject +
    "\n\n" +
    emailBlocks
      .map((block) => block.content)
      .filter(Boolean)
      .join("\n\n");
  return {
    id: row.id,
    name: row.name,
    channel: row.channel,
    audience: row.includedAudiences.join(", ") || "Not selected",
    status: row.status,
    reach: String(row.recipientCount || "-"),
    engagement: "-",
    date: row.scheduledAt
      ? new Date(row.scheduledAt).toLocaleString()
      : new Date(row.createdAt).toLocaleDateString(),
    tone: "violet",
    objective: row.objective,
    message,
    scheduledAt: row.scheduledAt ?? undefined,
    emailBlocks,
    attachments: row.attachmentNames,
    includedAudiences: row.includedAudiences,
    excludedAudiences: row.excludedAudiences,
    excludedContacts: row.excludedContacts,
    lastError: row.lastError,
  };
};
export const audienceRulesFromApi = (
  value: ApiAudience["rules"],
): FilterRule[] => {
  try {
    const rules = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(rules)) return [];
    return rules.filter((rule): rule is FilterRule =>
      Boolean(
        rule &&
        typeof rule.field === "string" &&
        typeof rule.operator === "string" &&
        typeof rule.value === "string",
      ),
    );
  } catch {
    return [];
  }
};
export const audienceRecordFromApi = (
  row: ApiAudience | ApiAudienceDetail,
  members: Contact[] = [],
): AudienceRecord => ({
  id: row.id,
  name: row.name,
  type: row.type === "dynamic" ? "Dynamic segment" : "Static group",
  description: row.description ?? "",
  count: String(row.memberCount),
  updated: new Date(row.updatedAt).toLocaleDateString(),
  tone: "violet",
  rules: audienceRulesFromApi(row.rules),
  members,
});
