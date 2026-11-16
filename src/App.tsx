import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowDown,
  ArrowDownToLine,
  ArrowUpRight,
  Bell,
  Blocks,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  ContactRound,
  Download,
  FileText,
  Filter,
  Gauge,
  Grid2X2,
  GripVertical,
  Image as ImageIcon,
  Layers3,
  LayoutDashboard,
  LifeBuoy,
  LoaderCircle,
  ListFilter,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { contactFromApi, crmApi, type ApiAudience, type ApiAudienceDetail, type ApiContact } from "./api";

type Page =
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
const normalizePath = (pathname: string) => {
  const normalized = `/${pathname.split("/").filter(Boolean).join("/")}`;
  return normalized === "/" ? normalized : normalized.replace(/\/$/, "");
};
const pageForPath = (pathname: string): Page => {
  const path = normalizePath(pathname).toLowerCase();
  if (path === "/" || path === "/dashboard") return "Dashboard";
  if (["/contacts", "/contact", "/cinntacat", "/contacts/new", "/contact/edit", "/contacts/edit", "/contacts/categories"].includes(path)) return path.endsWith("categories") ? "Categories" : "Contacts";
  if (/^\/(contacts|contact)\/[^/]+(\/edit)?$/.test(path)) return "Contact profile";
  if (path === "/audiences") return "Audiences";
  if (/^\/audiences\/[^/]+$/.test(path)) return "Audience profile";
  if (path === "/help" || path === "/help-centre") return "Help centre";
  if (path === "/notifications") return "Notifications";
  if (["/campaigns", "/campaigns/email"].includes(path)) return "Email campaigns";
  if (path === "/campaigns/sms") return "Bulk SMS";
  if (path === "/campaigns/whatsapp") return "WhatsApp";
  if (path === "/templates") return "Templates";
  if (path === "/scheduled") return "Scheduled";
  if (path === "/reports") return "Reports";
  if (path === "/audit" || path === "/audit-log") return "Audit log";
  if (path === "/settings") return "Settings";
  if (path === "/leads") return "Leads";
  return "Dashboard";
};
const pathForPage = (page: Page) => {
  const paths: Record<Page, string> = {
    Dashboard: "/dashboard",
    Contacts: "/contacts",
    Categories: "/contacts/categories",
    "Contact profile": "/contacts",
    "Audience profile": "/audiences",
    Audiences: "/audiences",
    "Help centre": "/help",
    Notifications: "/notifications",
    "Email campaigns": "/campaigns/email",
    "Bulk SMS": "/campaigns/sms",
    WhatsApp: "/campaigns/whatsapp",
    Templates: "/templates",
    Scheduled: "/scheduled",
    Reports: "/reports",
    "Audit log": "/audit",
    Settings: "/settings",
    Leads: "/leads",
  };
  return paths[page];
};
type Contact = {
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
type Campaign = {
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
};
type AuditEvent = [string, string, string, string, string, string];
type FilterRule = { field: string; operator: string; value: string };
type EmailBlock = {
  id: string;
  type: "text" | "image" | "link" | "button" | "divider";
  content: string;
  url?: string;
};
const serializeEmailBlocks = (blocks: EmailBlock[]) =>
  blocks
    .map((block) => {
      if (block.type === "image")
        return block.content ? `[Image: ${block.content}]` : "";
      if (block.type === "link")
        return block.url
          ? `[Link: ${block.content || block.url} - ${block.url}]`
          : block.content;
      if (block.type === "button")
        return block.url
          ? `[Button: ${block.content || "Learn more"} - ${block.url}]`
          : block.content;
      if (block.type === "divider") return "---";
      return block.content;
    })
    .filter(Boolean)
    .join("\n\n");
const getSmsEstimate = (message: string) => {
  const gsmBasic = new Set(
    Array.from(
      "@£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà\n\r",
    ),
  );
  const gsmExtended = new Set(Array.from("^{}\\[~]|€\f"));
  const chars = Array.from(message);
  const usesGsm = chars.every(
    (char) => gsmBasic.has(char) || gsmExtended.has(char),
  );
  const units = usesGsm
    ? chars.reduce((count, char) => count + (gsmExtended.has(char) ? 2 : 1), 0)
    : message.length;
  const singleLimit = usesGsm ? 160 : 70;
  const multipartLimit = usesGsm ? 153 : 67;
  const parts =
    units === 0
      ? 0
      : units <= singleLimit
        ? 1
        : Math.ceil(units / multipartLimit);
  return {
    characters: chars.length,
    units,
    encoding: usesGsm ? "GSM-7" : "UCS-2",
    capacity: units <= singleLimit ? singleLimit : multipartLimit,
    parts,
  };
};
type TeamRole =
  "Superadmin" | "Admin" | "Campaign Approver" | "Marketing Staff" | "Viewer";
type PermissionId =
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
type TeamUser = {
  name: string;
  email: string;
  role: TeamRole;
  permissions: PermissionId[];
};
const permissionCatalog: { id: PermissionId; label: string; group: string }[] =
  [
    { id: "contacts.view", label: "View contacts", group: "Contacts" },
    { id: "contacts.create", label: "Add contacts", group: "Contacts" },
    { id: "contacts.edit", label: "Edit contacts", group: "Contacts" },
    { id: "contacts.delete", label: "Delete contacts", group: "Contacts" },
    { id: "contacts.export", label: "Export contacts", group: "Contacts" },
    { id: "audiences.view", label: "View audiences", group: "Audiences" },
    {
      id: "audiences.manage",
      label: "Create and manage audiences",
      group: "Audiences",
    },
    { id: "campaigns.view", label: "View campaigns", group: "Campaigns" },
    { id: "campaigns.create", label: "Create campaigns", group: "Campaigns" },
    { id: "campaigns.approve", label: "Approve campaigns", group: "Campaigns" },
    {
      id: "campaigns.send",
      label: "Schedule and send campaigns",
      group: "Campaigns",
    },
    { id: "templates.manage", label: "Manage templates", group: "Templates" },
    { id: "reports.view", label: "View reports", group: "Reports" },
    { id: "reports.export", label: "Export reports", group: "Reports" },
    {
      id: "categories.manage",
      label: "Manage contact categories",
      group: "Contacts",
    },
    { id: "team.manage", label: "Manage users and roles", group: "Workspace" },
    {
      id: "settings.manage",
      label: "Manage workspace settings",
      group: "Workspace",
    },
  ];
const rolePermissions: Record<TeamRole, PermissionId[]> = {
  Superadmin: permissionCatalog.map((permission) => permission.id),
  Admin: [
    "contacts.view",
    "contacts.create",
    "contacts.edit",
    "contacts.delete",
    "contacts.export",
    "audiences.view",
    "audiences.manage",
    "campaigns.view",
    "campaigns.create",
    "campaigns.approve",
    "campaigns.send",
    "templates.manage",
    "reports.view",
    "reports.export",
    "categories.manage",
    "settings.manage",
  ],
  "Campaign Approver": [
    "contacts.view",
    "audiences.view",
    "campaigns.view",
    "campaigns.approve",
    "reports.view",
  ],
  "Marketing Staff": [
    "contacts.view",
    "contacts.create",
    "contacts.edit",
    "audiences.view",
    "audiences.manage",
    "campaigns.view",
    "campaigns.create",
    "templates.manage",
    "reports.view",
  ],
  Viewer: ["contacts.view", "audiences.view", "campaigns.view", "reports.view"],
};
const initialTeamUsers: TeamUser[] = [
  {
    name: "Amara Okafor",
    email: "amara@cephas.ng",
    role: "Superadmin",
    permissions: rolePermissions.Superadmin,
  },
  {
    name: "Tunde Bakare",
    email: "tunde@cephas.ng",
    role: "Campaign Approver",
    permissions: rolePermissions["Campaign Approver"],
  },
  {
    name: "Nneka Eze",
    email: "nneka@cephas.ng",
    role: "Marketing Staff",
    permissions: rolePermissions["Marketing Staff"],
  },
  {
    name: "David Adebayo",
    email: "david@cephas.ng",
    role: "Viewer",
    permissions: rolePermissions.Viewer,
  },
];
function loadTeamUsers(): TeamUser[] {
  try {
    const saved = JSON.parse(
      localStorage.getItem("cephas.team-users") ?? "null",
    ) as TeamUser[] | null;
    if (
      Array.isArray(saved) &&
      saved.some(
        (user) =>
          user.email === "amara@cephas.ng" && user.role === "Superadmin",
      )
    )
      return saved;
  } catch {
    // Use the default team when local preview data is missing or invalid.
  }
  return initialTeamUsers;
}
type TemplateDraft = {
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
type AudienceRecord = {
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
type AudienceDraft = {
  id: string;
  name: string;
  type: "Dynamic segment" | "Static group";
  description: string;
  rules: FilterRule[];
  members: Contact[];
  memberCount?: number;
  updatedAt: string;
};
const initialCategories = ["Uncategorized"];
const audienceRulesFromApi = (value: ApiAudience["rules"]): FilterRule[] => {
  try {
    const rules = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(rules)) return [];
    return rules.filter((rule): rule is FilterRule => Boolean(rule && typeof rule.field === "string" && typeof rule.operator === "string" && typeof rule.value === "string"));
  } catch {
    return [];
  }
};
const audienceRecordFromApi = (row: ApiAudience | ApiAudienceDetail, members: Contact[] = []): AudienceRecord => ({
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
const navGroups: {
  label: string;
  items: { name: Page; icon: typeof Grid2X2; badge?: string }[];
}[] = [
  {
    label: "WORKSPACE",
    items: [
      { name: "Dashboard", icon: LayoutDashboard },
      { name: "Contacts", icon: ContactRound },
      { name: "Audiences", icon: Users },
    ],
  },
  {
    label: "COMMUNICATIONS",
    items: [
      { name: "Email campaigns", icon: Mail },
      { name: "Bulk SMS", icon: MessageSquareText },
      { name: "WhatsApp", icon: MessageCircle },
      { name: "Templates", icon: FileText },
      { name: "Scheduled", icon: CalendarDays },
    ],
  },
  {
    label: "INSIGHTS",
    items: [
      { name: "Reports", icon: TrendingUp },
      { name: "Audit log", icon: ShieldCheck },
    ],
  },
];
const campaigns: Campaign[] = [
  {
    name: "Cybersecurity Training Campaign",
    channel: "Email",
    audience: "Cybersecurity interest",
    status: "Sent",
    reach: "2,840",
    engagement: "42.8%",
    date: "Nov 12, 2026",
    tone: "violet",
  },
  {
    name: "November Alumni Update",
    channel: "Email",
    audience: "Alumni · Lagos",
    status: "Scheduled",
    reach: "1,260",
    engagement: "—",
    date: "Nov 14, 2026",
    tone: "orange",
  },
  {
    name: "Cohort orientation reminder",
    channel: "SMS",
    audience: "November cohort · 486 contacts",
    status: "Scheduled",
    reach: "486",
    engagement: "—",
    date: "Nov 15, 2026",
    tone: "green",
  },
  {
    name: "December course preview",
    channel: "Email",
    audience: "New prospects · 312 contacts",
    status: "Scheduled",
    reach: "312",
    engagement: "—",
    date: "Nov 18, 2026",
    tone: "blue",
  },
  {
    name: "Training starts tomorrow",
    channel: "SMS",
    audience: "November cohort",
    status: "Draft",
    reach: "486",
    engagement: "—",
    date: "Nov 13, 2026",
    tone: "green",
  },
  {
    name: "WhatsApp programme welcome",
    channel: "WhatsApp",
    audience: "New prospects · 128 contacts",
    status: "Draft",
    reach: "128",
    engagement: "—",
    date: "Nov 13, 2026",
    tone: "green",
    objective: "Welcome new programme prospects",
    message:
      "Hi {{first_name}}, thanks for your interest in Cephas. Reply here if you have questions about the programme.",
  },
  {
    name: "October Learning Digest",
    channel: "Email",
    audience: "All subscribers",
    status: "Sent",
    reach: "5,420",
    engagement: "38.2%",
    date: "Nov 03, 2026",
    tone: "blue",
  },
];
const auditRows: AuditEvent[] = [
  [
    "Amara Okafor",
    "Approved campaign",
    "Cybersecurity Training Campaign",
    "Campaign approval",
    "Nov 13, 10:42 AM",
    "green",
  ],
  [
    "Tunde Bakare",
    "Updated contact",
    "Chidi Nwosu · consent preference",
    "Contact updated",
    "Nov 13, 9:18 AM",
    "blue",
  ],
  [
    "Nneka Eze",
    "Exported contacts",
    "Student cohort · 248 records",
    "Data export",
    "Nov 13, 8:56 AM",
    "orange",
  ],
  [
    "David Adebayo",
    "Created segment",
    "Cybersecurity interest",
    "Audience created",
    "Nov 12, 4:32 PM",
    "violet",
  ],
  [
    "Zainab Musa",
    "Imported contacts",
    "November prospects.csv · 126 records",
    "Contact import",
    "Nov 12, 2:14 PM",
    "pink",
  ],
  [
    "Chidi Nwosu",
    "Initiated campaign",
    "October Learning Digest · Email",
    "Campaign sent",
    "Nov 12, 11:06 AM",
    "green",
  ],
];
function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return (
    <span className={`badge ${tone.toLowerCase().replace(" ", "-")}`}>
      {children}
    </span>
  );
}
export function CRMApp({
  account,
  onSignOut,
}: {
  account: { name: string; email: string };
  onSignOut: () => Promise<void>;
}) {
  const accountName = account.name || account.email;
  const accountInitials = accountName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const toastTimer = useRef<number | undefined>(undefined);
  const [page, setPage] = useState<Page>(() => pageForPath(window.location.pathname)),
    [contacts, setContacts] = useState<Contact[]>([]),
    [categories, setCategories] = useState<string[]>(initialCategories),
    [contactsLoading, setContactsLoading] = useState(true),
    [contactsError, setContactsError] = useState(""),
    [contactsReloadKey, setContactsReloadKey] = useState(0),
    [activeContact, setActiveContact] = useState<Contact | null>(null),
    [campaignRecords, setCampaignRecords] = useState<Campaign[]>(campaigns),
    [templateDrafts, setTemplateDrafts] = useState<TemplateDraft[]>([]),
    [campaignTemplateSeed, setCampaignTemplateSeed] =
      useState<TemplateDraft | null>(null),
    [activeAudience, setActiveAudience] = useState<AudienceRecord | null>(null),
    [audienceDrafts, setAudienceDrafts] = useState<AudienceDraft[]>([]),
    [audienceLoading, setAudienceLoading] = useState(true),
    [audienceError, setAudienceError] = useState(""),
    [audienceReloadKey, setAudienceReloadKey] = useState(0),
    [audienceProfileLoading, setAudienceProfileLoading] = useState(() => pageForPath(window.location.pathname) === "Audience profile"),
    [audienceProfileError, setAudienceProfileError] = useState(""),
    [audienceEditSeed, setAudienceEditSeed] = useState<AudienceRecord | null>(null),
    [segmentSeedContacts, setSegmentSeedContacts] = useState<Contact[]>([]),
    [campaignAudienceSeed, setCampaignAudienceSeed] = useState(""),
    [auditEvents, setAuditEvents] = useState<AuditEvent[]>(auditRows),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("All categories"),
    [statusFilter, setStatusFilter] = useState("All statuses"),
    [sortBy, setSortBy] = useState("Recently added"),
    [selected, setSelected] = useState<string[]>([]),
    [contactsPage, setContactsPage] = useState(0),
    [contactToDelete, setContactToDelete] = useState<Contact | null>(null),
    [confirmBulkDelete, setConfirmBulkDelete] = useState(false),
    [toast, setToast] = useState(""),
    [modal, setModal] = useState(() => normalizePath(window.location.pathname).toLowerCase() === "/contacts/new" ? "add" : ""),
    [pendingDuplicate, setPendingDuplicate] = useState<{
      existing: Contact;
      incoming: Contact;
      sourceId?: string;
    } | null>(null),
    [mobile, setMobile] = useState(false),
    [sidebarCollapsed, setSidebarCollapsed] = useState(false),
    [period, setPeriod] = useState("Last 30 days");
  useEffect(() => {
    let active = true;
    setContactsLoading(true);
    setContactsError("");
    Promise.all([crmApi.listContacts(), crmApi.listCategories()])
      .then(([rows, categoryNames]) => {
        if (!active) return;
        const loaded = rows.map((row) => contactFromApi(row) as Contact);
        setContacts(loaded);
        setCategories(Array.from(new Set(["Uncategorized", ...categoryNames, ...loaded.map((contact) => contact.category)])));
      })
      .catch((error: unknown) => {
        if (!active) return;
        setContactsError(error instanceof Error ? error.message : "Could not connect to the CRM API");
      })
      .finally(() => { if (active) setContactsLoading(false); });
    return () => { active = false; };
  }, [contactsReloadKey]);
  useEffect(() => {
    let active = true;
    setAudienceLoading(true);
    setAudienceError("");
    crmApi.listAudiences().then((rows) => {
      if (!active) return;
      setAudienceDrafts(rows.map((row): AudienceDraft => ({
        id: row.id,
        name: row.name,
        type: row.type === "dynamic" ? "Dynamic segment" : "Static group",
        description: row.description ?? "",
        rules: audienceRulesFromApi(row.rules),
        members: [],
        memberCount: row.memberCount,
        updatedAt: row.updatedAt,
      })));
    }).catch((error: unknown) => {
      if (active) setAudienceError(error instanceof Error ? error.message : "Could not load audiences from the CRM API");
    }).finally(() => { if (active) setAudienceLoading(false); });
    return () => { active = false; };
  }, [audienceReloadKey]);
  const toApiContact = (contact: Contact): Omit<ApiContact, "id" | "createdAt"> => {
    const [firstName, ...lastNames] = contact.name.trim().split(/\s+/);
    return {
      firstName: firstName || contact.email.split("@")[0],
      lastName: lastNames.join(" ") || null,
      email: contact.email,
      alternateEmails: contact.alternateEmails ?? [],
      phone: contact.phone || null,
      organization: contact.organization || null,
      category: contact.category || null,
      location: contact.location || null,
      interests: contact.interests ?? [],
      tags: contact.tags ?? [],
      emailConsent: contact.status,
      smsConsent: contact.smsStatus ?? "Pending",
    };
  };
  const filtered = useMemo(
    () =>
      contacts
        .filter(
          (c) =>
            (
              c.name +
              c.email +
              c.phone +
              c.organization +
              c.category +
              c.location +
              (c.tags ?? []).join(" ") +
              (c.interests ?? []).join(" ")
            )
              .toLowerCase()
              .includes(query.toLowerCase()) &&
            (category === "All categories" || c.category === category) &&
            (statusFilter === "All statuses" || c.status === statusFilter),
        )
        .sort((a, b) =>
          sortBy === "Name A–Z"
            ? a.name.localeCompare(b.name)
            : contacts.indexOf(a) - contacts.indexOf(b),
        ),
    [contacts, query, category, statusFilter, sortBy],
  );
  const selectedVisible = selected.filter((email) =>
    filtered.some((c) => c.email === email),
  );
  const pageSize = 25;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleContacts = filtered.slice(contactsPage * pageSize, (contactsPage + 1) * pageSize);
  useEffect(() => { setContactsPage(0); }, [query, category, statusFilter, sortBy]);
  useEffect(() => {
    setContactsPage((current) => Math.min(current, pageCount - 1));
  }, [pageCount]);
  const notify = (s: string) => {
    if (toastTimer.current !== undefined) {
      window.clearTimeout(toastTimer.current);
    }
    setToast(s);
    toastTimer.current = window.setTimeout(() => setToast(""), 2600);
  };
  const recordAudit = (activity: string, details: string, eventType: string) =>
    setAuditEvents((rows) => [
      ["Amara Okafor", activity, details, eventType, "Just now", "violet"],
      ...rows,
    ]);
  const go = (p: Page) => {
    const path = p === "Contact profile" && activeContact
      ? `/contacts/${encodeURIComponent(activeContact.id || activeContact.email)}`
      : p === "Audience profile" && activeAudience
        ? `/audiences/${encodeURIComponent(activeAudience.id)}`
        : pathForPage(p);
    if (normalizePath(window.location.pathname) !== path) {
      window.history.pushState({}, "", path);
    }
    setPage(p);
    setMobile(false);
    setSelected([]);
  };
  const normalizeModalRoute = () => {
    const path = normalizePath(window.location.pathname);
    if (path.toLowerCase() === "/contacts/new") {
      window.history.replaceState({}, "", "/contacts");
    } else {
      const edit = path.match(/^\/(?:contacts|contact)\/([^/]+)\/edit$/i);
      if (edit) window.history.replaceState({}, "", `/contacts/${edit[1]}`);
    }
  };
  const openContactProfile = (contact: Contact) => {
    const key = contact.id || contact.email;
    window.history.pushState({}, "", `/contacts/${encodeURIComponent(key)}`);
    setActiveContact(contact);
    setPage("Contact profile");
    setMobile(false);
    setSelected([]);
    recordAudit(
      "Viewed contact profile",
      `${contact.name} - ${contact.email}`,
      "Profile viewed",
    );
  };
  useEffect(() => {
    const normalized = normalizePath(window.location.pathname);
    if (normalized !== window.location.pathname) window.history.replaceState({}, "", normalized);
    const syncRoute = () => {
      const routePath = normalizePath(window.location.pathname);
      const nextPage = pageForPath(routePath);
      setPage(nextPage);
      setSelected([]);
      const match = routePath.match(/^\/(?:contacts|contact)\/([^/]+)(?:\/edit)?$/i);
      if (nextPage === "Contact profile" && match && match[1].toLowerCase() !== "edit") {
        const key = decodeURIComponent(match[1]);
        setActiveContact(contacts.find((item) => item.id === key || item.email.toLowerCase() === key.toLowerCase()) ?? null);
        setModal(/\/edit$/i.test(routePath) ? "edit-contact" : "");
      } else {
        setActiveContact(null);
        setModal("");
      }
    };
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, [contacts]);
  useEffect(() => {
    if (page !== "Contact profile") return;
    const match = normalizePath(window.location.pathname).match(/^\/(?:contacts|contact)\/([^/]+)(?:\/edit)?$/i);
    if (!match || match[1].toLowerCase() === "edit") return;
    const key = decodeURIComponent(match[1]);
    const contact = contacts.find((item) => item.id === key || item.email.toLowerCase() === key.toLowerCase());
    setActiveContact(contact ?? null);
    if (contact && /\/edit$/i.test(normalizePath(window.location.pathname))) setModal("edit-contact");
    else if (!/\/edit$/i.test(normalizePath(window.location.pathname))) setModal("");
  }, [contacts, page]);
  useEffect(() => {
    if (page !== "Audience profile") return;
    const match = normalizePath(window.location.pathname).match(/^\/audiences\/([^/]+)$/i);
    if (!match) {
      setActiveAudience(null);
      return;
    }
    const key = decodeURIComponent(match[1]);
    if (audienceLoading) return;
    const draft = audienceDrafts.find((item) => item.id === key || item.name.toLowerCase() === key.toLowerCase());
    if (!draft) {
      setActiveAudience(null);
      setAudienceProfileError("This audience could not be found. Return to the audience list and refresh it.");
      setAudienceProfileLoading(false);
      return;
    }
    let active = true;
    setAudienceProfileLoading(true);
    setAudienceProfileError("");
    crmApi.getAudience(draft.id).then((saved) => {
      if (!active) return;
      const members = saved.members.map((member) => contactFromApi(member.contact) as Contact);
      setActiveAudience(audienceRecordFromApi(saved, members));
    }).catch((error: unknown) => {
      if (active) setAudienceProfileError(error instanceof Error ? error.message : "Could not load this audience from the API");
    }).finally(() => { if (active) setAudienceProfileLoading(false); });
    return () => { active = false; };
  }, [audienceDrafts, audienceLoading, page]);
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        go("Contacts");
        window.setTimeout(
          () => document.getElementById("contact-search")?.focus(),
          0,
        );
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);
  const addContact = async (contact: Contact) => {
    const normalizedPhone = contact.phone?.replace(/\D/g, "");
    const duplicate = contacts.find(
      (current) =>
        current.email.toLowerCase() === contact.email.toLowerCase() ||
        (normalizedPhone &&
          current.phone?.replace(/\D/g, "") === normalizedPhone),
    );
    if (duplicate) {
      setPendingDuplicate({ existing: duplicate, incoming: contact });
      setModal("");
      return;
    }
    try {
      const saved = await crmApi.createContact(toApiContact(contact));
      const persisted = contactFromApi(saved) as Contact;
      setContacts((current) => [persisted, ...current]);
      setAudienceReloadKey((key) => key + 1);
      setCategories((current) => current.includes(persisted.category) ? current : [...current, persisted.category]);
    } catch (error) {
      notify(`Could not save contact: ${error instanceof Error ? error.message : "API error"}`);
      return;
    }
    recordAudit(
      "Created contact",
      `${contact.name} · ${contact.email}`,
      "Contact created",
    );
    normalizeModalRoute();
    setModal("");
    notify("Contact saved to the CRM");
  };
  const updateContact = async (contact: Contact) => {
    const normalizedPhone = contact.phone?.replace(/\D/g, "");
    const duplicate = contacts.find(
      (current) =>
        current.email.toLowerCase() !== activeContact?.email.toLowerCase() &&
        (current.email.toLowerCase() === contact.email.toLowerCase() ||
          Boolean(
            normalizedPhone &&
            current.phone?.replace(/\D/g, "") === normalizedPhone,
          )),
    );
    if (duplicate) {
      setPendingDuplicate({
        existing: duplicate,
        incoming: contact,
        sourceId: activeContact?.id,
      });
      setModal("");
      return;
    }
    const existingContact = contacts.find((item) => item.id === activeContact?.id);
    if (!existingContact?.id) {
      notify("This sample contact is not stored in the CRM yet");
      return;
    }
    let saved: ApiContact;
    try {
      saved = await crmApi.updateContact(existingContact.id, toApiContact(contact));
    } catch (error) {
      notify(`Could not update contact: ${error instanceof Error ? error.message : "API error"}`);
      return;
    }
    const persisted = contactFromApi(saved) as Contact;
    setContacts((current) =>
      current.map((item) => item.id === existingContact.id ? persisted : item),
    );
    setAudienceReloadKey((key) => key + 1);
    setCategories((current) => current.includes(persisted.category) ? current : [...current, persisted.category]);
    setActiveContact(persisted);
    const changes = [
      contact.name !== activeContact?.name ? "name" : "",
      contact.email.toLowerCase() !== activeContact?.email.toLowerCase()
        ? "email"
        : "",
      contact.phone !== activeContact?.phone ? "phone" : "",
      contact.organization !== activeContact?.organization
        ? "organisation"
        : "",
      contact.category !== activeContact?.category ? "category" : "",
      contact.location !== activeContact?.location ? "location" : "",
      JSON.stringify(contact.tags) !== JSON.stringify(activeContact?.tags)
        ? "tags"
        : "",
      JSON.stringify(contact.interests) !==
      JSON.stringify(activeContact?.interests)
        ? "interests"
        : "",
      contact.status !== activeContact?.status
        ? `email consent ${activeContact?.status} → ${contact.status}`
        : "",
      contact.smsStatus !== activeContact?.smsStatus
        ? `SMS opt-in ${activeContact?.smsStatus ?? "Pending"} → ${contact.smsStatus ?? "Pending"}`
        : "",
    ].filter(Boolean);
    recordAudit(
      "Updated contact",
      `${contact.name} - ${changes.join(", ") || "record details"}`,
      "Contact updated",
    );
    normalizeModalRoute();
    setModal("");
    notify("Contact updated in the CRM");
  };
  const mergeDuplicateContact = async () => {
    if (!pendingDuplicate) return;
    const { existing, incoming } = pendingDuplicate;
    const merged: Contact = {
      ...existing,
      phone: existing.phone || incoming.phone,
      organization: existing.organization || incoming.organization,
      location: existing.location || incoming.location,
      interests: [
        ...new Set([
          ...(existing.interests ?? []),
          ...(incoming.interests ?? []),
        ]),
      ],
      tags: [...new Set([...(existing.tags ?? []), ...(incoming.tags ?? [])])],
      alternateEmails: [
        ...new Set([
          ...(existing.alternateEmails ?? []),
          ...(incoming.email.toLowerCase() === existing.email.toLowerCase()
            ? []
            : [incoming.email]),
        ]),
      ],
      status:
        existing.status === "Unsubscribed" || incoming.status === "Unsubscribed"
          ? "Unsubscribed"
          : existing.status === "Pending" || incoming.status === "Pending"
            ? "Pending"
            : "Subscribed",
      smsStatus:
        existing.smsStatus === "Unsubscribed" ||
        incoming.smsStatus === "Unsubscribed"
          ? "Unsubscribed"
          : existing.smsStatus === "Pending" || incoming.smsStatus === "Pending"
            ? "Pending"
            : existing.smsStatus === "Subscribed" &&
                incoming.smsStatus === "Subscribed"
              ? "Subscribed"
              : "Pending",
    };
    if (!existing.id) {
      notify("The matching contact has no CRM record ID. Refresh contacts and try again.");
      return;
    }
    try {
      const saved = await crmApi.mergeContact(existing.id, pendingDuplicate.sourceId, toApiContact(merged));
      const persisted = contactFromApi(saved) as Contact;
      setContacts((current) => current
        .filter((item) => !pendingDuplicate.sourceId || item.id !== pendingDuplicate.sourceId)
        .map((item) => item.id === existing.id ? persisted : item));
      setAudienceReloadKey((key) => key + 1);
      setCategories((current) => current.includes(persisted.category) ? current : [...current, persisted.category]);
      if (activeContact?.id === existing.id || activeContact?.id === pendingDuplicate.sourceId) setActiveContact(persisted);
    } catch (error) {
      notify(`Could not merge contact records: ${error instanceof Error ? error.message : "API error"}`);
      return;
    }
    recordAudit(
      "Merged duplicate contact",
      `${incoming.name} into ${existing.name} · consent preserved`,
      "Contact merged",
    );
    setPendingDuplicate(null);
    notify(
      "Duplicate details merged; existing contact identity and consent were preserved",
    );
  };
  const keepDuplicateSeparate = async () => {
    if (!pendingDuplicate) return;
    if (pendingDuplicate.incoming.email.toLowerCase() === pendingDuplicate.existing.email.toLowerCase()) {
      notify("This email address already belongs to the matching contact. Merge the records instead.");
      return;
    }
    try {
      const saved = await crmApi.createContact(toApiContact(pendingDuplicate.incoming));
      const persisted = contactFromApi(saved) as Contact;
      setContacts((current) => [persisted, ...current]);
      setAudienceReloadKey((key) => key + 1);
      setCategories((current) => current.includes(persisted.category) ? current : [...current, persisted.category]);
    } catch (error) {
      notify(`Could not save separate contact: ${error instanceof Error ? error.message : "API error"}`);
      return;
    }
    recordAudit(
      "Kept likely duplicate separate",
      `${pendingDuplicate.incoming.name} · ${pendingDuplicate.incoming.email}`,
      "Duplicate review",
    );
    setPendingDuplicate(null);
    notify("Contact saved as a separate record");
  };
  const removeContact = async (contact: Contact) => {
    if (!contact.id) {
      notify("This contact is not linked to an API record. Refresh the list and try again.");
      return;
    }
    try {
      await crmApi.deleteContact(contact.id);
      setContacts((current) => current.filter((item) => item.id !== contact.id));
      setAudienceReloadKey((key) => key + 1);
      setSelected((current) => current.filter((email) => email !== contact.email));
      recordAudit("Deleted contact", `${contact.name} · ${contact.email}`, "Contact deleted");
      setContactToDelete(null);
      if (activeContact?.id === contact.id) {
        setActiveContact(null);
        go("Contacts");
      }
      notify(`${contact.name} deleted`);
    } catch (error) {
      notify(`Could not delete contact: ${error instanceof Error ? error.message : "API error"}`);
    }
  };
  const removeSelectedContacts = async () => {
    const targets = contacts.filter((contact) => selectedVisible.includes(contact.email));
    if (!targets.length) {
      setConfirmBulkDelete(false);
      return;
    }
    if (targets.some((contact) => !contact.id)) {
      notify("One or more selected contacts are missing API IDs. Refresh the list and try again.");
      setConfirmBulkDelete(false);
      return;
    }
    try {
      const result = await crmApi.deleteContacts(targets.map((contact) => contact.id!));
      const deletedIds = new Set(result.ids);
      setContacts((current) => current.filter((contact) => !deletedIds.has(contact.id ?? "")));
      setAudienceReloadKey((key) => key + 1);
      setSelected([]);
      setConfirmBulkDelete(false);
      recordAudit("Deleted contacts", `${result.deleted} contact records`, "Contacts deleted");
      notify(`${result.deleted} contact${result.deleted === 1 ? "" : "s"} deleted`);
    } catch (error) {
      notify(`Could not delete selected contacts: ${error instanceof Error ? error.message : "API error"}`);
    }
  };
  const addCampaignDraft = (
    channel: "Email" | "SMS" | "WhatsApp",
    name: string,
    audience: string,
    objective: string,
    message: string,
    status = "Draft",
    scheduledAt = "",
    emailBlocks?: EmailBlock[],
    attachments?: string[],
    targeting?: {
      includedAudiences: string[];
      excludedAudiences: string[];
      excludedContacts: string[];
    },
  ) => {
    setCampaignRecords((current) => [
      {
        name,
        channel,
        audience: audience || "Not selected",
        status,
        reach: "—",
        engagement: "—",
        date: scheduledAt
          ? new Date(scheduledAt).toLocaleString()
          : new Date().toLocaleDateString(),
        tone: channel === "Email" ? "violet" : "green",
        objective,
        message,
        scheduledAt: scheduledAt || undefined,
        emailBlocks,
        attachments,
        ...targeting,
      },
      ...current,
    ]);
    recordAudit(
      status === "Scheduled" ? "Scheduled campaign" : "Created campaign draft",
      `${name} · ${channel}`,
      status === "Scheduled" ? "Campaign schedule" : "Campaign draft",
    );
    setModal("");
    setCampaignAudienceSeed("");
    setCampaignTemplateSeed(null);
    notify(
      status === "Scheduled"
        ? "Campaign scheduled in this preview; no provider delivery is connected"
        : "Campaign draft saved in this preview",
    );
  };
  const requestCampaignApproval = (name: string) => {
    setCampaignRecords((current) =>
      current.map((campaign) =>
        campaign.name === name
          ? { ...campaign, status: "Pending approval" }
          : campaign,
      ),
    );
    recordAudit("Submitted campaign for approval", name, "Campaign approval");
    notify("Campaign submitted for approval in this preview");
  };
  const duplicateCampaign = (campaign: Campaign) => {
    const baseName = `${campaign.name} copy`;
    let copyName = baseName;
    let suffix = 2;
    while (
      campaignRecords.some(
        (record) =>
          record.name.toLowerCase() === `${copyName} campaign`.toLowerCase(),
      )
    ) {
      copyName = `${baseName} ${suffix++}`;
    }
    let body = campaign.message ?? "";
    let subject = "";
    if (campaign.channel === "Email" && body.startsWith("Subject: ")) {
      const [subjectLine, ...content] = body.split("\n\n");
      subject = subjectLine.slice("Subject: ".length);
      body = content.join("\n\n");
    }
    body = body.replace(/\n\nAttachments: [\s\S]*$/, "");
    setCampaignTemplateSeed({
      name: copyName,
      channel: campaign.channel,
      subject,
      body,
      emailBlocks: campaign.emailBlocks,
      attachments: campaign.attachments,
      objective: campaign.objective,
      excludedAudiences: campaign.excludedAudiences,
      excludedContacts: campaign.excludedContacts,
    });
    const includedAudiences = campaign.includedAudiences?.length
      ? campaign.includedAudiences.join(", ")
      : campaign.audience === "Not selected"
        ? ""
        : campaign.audience.split(" · ")[0];
    setCampaignAudienceSeed(includedAudiences);
    setModal(
      campaign.channel === "Email"
        ? "email"
        : campaign.channel === "SMS"
          ? "sms"
          : "whatsapp",
    );
    recordAudit("Started campaign duplicate", campaign.name, "Campaign draft");
  };
  const cancelScheduled = (name: string) => {
    setCampaignRecords((current) =>
      current.map((campaign) =>
        campaign.name === name
          ? { ...campaign, status: "Cancelled" }
          : campaign,
      ),
    );
    recordAudit("Cancelled scheduled campaign", name, "Campaign schedule");
    notify(`${name} cancelled in this preview`);
  };
  const toggleScheduledPause = (name: string, paused: boolean) => {
    setCampaignRecords((current) =>
      current.map((campaign) =>
        campaign.name === name
          ? { ...campaign, status: paused ? "Paused" : "Scheduled" }
          : campaign,
      ),
    );
    recordAudit(
      paused ? "Paused scheduled campaign" : "Resumed scheduled campaign",
      name,
      "Campaign schedule",
    );
    notify(
      paused
        ? `${name} paused in this preview`
        : `${name} returned to the schedule in this preview`,
    );
  };
  const addAudienceDraft = async (
    name: string,
    type: "Dynamic segment" | "Static group",
    rules: FilterRule[],
    members: Contact[],
    audienceId?: string,
    description?: string,
  ) => {
    const resolvedMembers = type === "Static group" ? members : [];
    const contactIds = type === "Static group" ? resolvedMembers.map((contact) => contact.id).filter((id): id is string => Boolean(id)) : [];
    if (!audienceId && type === "Static group" && contactIds.length !== resolvedMembers.length) {
      notify("Some selected contacts are not synced with the CRM API. Refresh contacts and retry.");
      return;
    }
    let savedAudience;
    try {
      const payload = {
        name,
        type: type === "Dynamic segment" ? "dynamic" as const : "static" as const,
        description: description?.trim() || (type === "Dynamic segment" ? `${rules.length} saved conditions` : `${resolvedMembers.length} selected contacts`),
        rules: type === "Dynamic segment" ? rules : [],
        ...(type === "Static group" ? { contactIds } : {}),
      };
      savedAudience = audienceId
        ? await crmApi.updateAudience(audienceId, payload)
        : await crmApi.createAudience(payload);
    } catch (error) {
      notify(`Could not ${audienceId ? "update" : "save"} audience: ${error instanceof Error ? error.message : "API error"}`);
      return;
    }
    const savedMembers = type === "Static group" ? resolvedMembers : [];
    const record = audienceRecordFromApi(savedAudience, savedMembers);
    setActiveAudience(record);
      setAudienceDrafts((current) => audienceId
        ? current.map((audience) => audience.id === audienceId
          ? { ...audience, id: record.id, name: record.name, type: record.type, description: record.description, rules: record.rules, members: savedMembers, memberCount: Number(record.count), updatedAt: savedAudience.updatedAt }
          : audience)
        : [{ id: record.id, name: record.name, type: record.type, description: record.description, rules: record.rules, members: savedMembers, memberCount: Number(record.count), updatedAt: savedAudience.updatedAt }, ...current]);
    recordAudit(
      audienceId ? "Updated audience" : "Created audience",
      `${name} · ${type} · ${savedAudience.memberCount ?? resolvedMembers.length} contacts · ${rules.length} conditions`,
      audienceId ? "Audience updated" : "Audience created",
    );
    setModal("");
    setAudienceEditSeed(null);
    notify(`${name} ${audienceId ? "updated" : "saved"} with ${savedAudience.memberCount ?? resolvedMembers.length} contacts`);
  };
  const openAudienceBuilder = (members: Contact[] = []) => {
    setSegmentSeedContacts(members);
    setSelected([]);
    setModal("segment");
    go("Audiences");
  };
  const openCampaignForAudience = (name: string) => {
    setCampaignAudienceSeed(name);
    go("Email campaigns");
    setModal("email");
  };
  const openAudienceDetails = (audience: AudienceRecord) => {
    window.history.pushState({}, "", `/audiences/${encodeURIComponent(audience.id)}`);
    setActiveAudience(audience);
    setAudienceProfileLoading(true);
    setAudienceProfileError("");
    setPage("Audience profile");
    setSelected([]);
    recordAudit("Viewed audience details", audience.name, "Audience viewed");
  };
  const refreshAudience = async (id: string) => {
    const saved = await crmApi.getAudience(id);
    const members = saved.members.map((member) => contactFromApi(member.contact) as Contact);
    const record = audienceRecordFromApi(saved, members);
    setActiveAudience(record);
    setAudienceDrafts((current) => current.map((audience) => audience.id === id
      ? { ...audience, name: record.name, type: record.type, description: record.description, rules: record.rules, members, memberCount: Number(record.count), updatedAt: saved.updatedAt }
      : audience));
  };
  const addMembersToAudience = async (id: string, contactIds: string[]) => {
    let added = 0;
    try {
      const result = await crmApi.addAudienceMembers(id, contactIds);
      added = result.added;
    } catch (error) {
      notify(`Could not add audience members: ${error instanceof Error ? error.message : "API error"}`);
      throw error;
    }
    try {
      await refreshAudience(id);
    } catch {
      setAudienceReloadKey((key) => key + 1);
    }
    notify(`${added} contact${added === 1 ? "" : "s"} added to the audience`);
  };
  const removeAudienceMember = async (id: string, contactId: string) => {
    try {
      await crmApi.removeAudienceMember(id, contactId);
    } catch (error) {
      notify(`Could not remove audience member: ${error instanceof Error ? error.message : "API error"}`);
      return;
    }
    try {
      await refreshAudience(id);
    } catch {
      setAudienceReloadKey((key) => key + 1);
    }
    notify("Contact removed from the audience");
  };
  const deleteActiveAudience = async () => {
    if (!activeAudience) return;
    try {
      await crmApi.deleteAudience(activeAudience.id);
      setAudienceDrafts((current) => current.filter((audience) => audience.id !== activeAudience.id));
      recordAudit("Deleted audience", activeAudience.name, "Audience deleted");
      setActiveAudience(null);
      go("Audiences");
      notify(`${activeAudience.name} deleted`);
    } catch (error) {
      notify(`Could not delete audience: ${error instanceof Error ? error.message : "API error"}`);
    }
  };
  const createCategory = async (name: string) => {
    try {
      const created = await crmApi.createCategory(name);
      setCategories((current) => current.includes(created.name) ? current : [...current, created.name]);
    } catch (error) {
      notify(`Could not create category: ${error instanceof Error ? error.message : "API error"}`);
      return;
    }
    recordAudit("Created contact category", name, "Category created");
    notify(`${name} category created in the CRM`);
  };
  const renameCategory = async (previous: string, next: string) => {
    try {
      await crmApi.renameCategory(previous, next);
    } catch (error) {
      notify(`Could not rename category: ${error instanceof Error ? error.message : "API error"}`);
      return;
    }
    setCategories((current) =>
      current.map((name) => (name === previous ? next : name)),
    );
    setContacts((current) =>
      current.map((contact) =>
        contact.category === previous
          ? { ...contact, category: next }
          : contact,
      ),
    );
    setAudienceReloadKey((key) => key + 1);
    setAudienceDrafts((current) =>
      current.map((audience) => ({
        ...audience,
        members: audience.members.map((member) =>
          member.category === previous ? { ...member, category: next } : member,
        ),
        rules: audience.rules.map((rule) =>
          rule.field === "Category" && rule.value === previous
            ? { ...rule, value: next }
            : rule,
        ),
      })),
    );
    if (category === previous) setCategory(next);
    recordAudit(
      "Renamed contact category",
      `${previous} → ${next}`,
      "Category updated",
    );
    notify(`${previous} renamed to ${next} in the CRM`);
  };
  const deleteCategory = async (name: string) => {
    const fallback =
      categories.find((categoryName) => categoryName !== name) ??
      "Uncategorized";
    const affected = contacts.filter(
      (contact) => contact.category === name,
    ).length;
    try {
      await crmApi.deleteCategory(name, fallback);
    } catch (error) {
      notify(`Could not delete category: ${error instanceof Error ? error.message : "API error"}`);
      return;
    }
    setCategories((current) =>
      current.filter((categoryName) => categoryName !== name),
    );
    setContacts((current) =>
      current.map((contact) =>
        contact.category === name
          ? { ...contact, category: fallback }
          : contact,
      ),
    );
    setAudienceReloadKey((key) => key + 1);
    setAudienceDrafts((current) =>
      current.map((audience) => ({
        ...audience,
        members: audience.members.map((member) =>
          member.category === name ? { ...member, category: fallback } : member,
        ),
        rules: audience.rules.map((rule) =>
          rule.field === "Category" && rule.value === name
            ? { ...rule, value: fallback }
            : rule,
        ),
      })),
    );
    if (category === name) setCategory("All categories");
    recordAudit(
      "Deleted contact category",
      `${name}; reassigned ${affected} contacts to ${fallback}`,
      "Category deleted",
    );
    notify(`${name} deleted; ${affected} contacts moved to ${fallback}`);
  };
  const openCampaignFromTemplate = (template: TemplateDraft) => {
    setCampaignTemplateSeed(template);
    const page =
      template.channel === "WhatsApp"
        ? "WhatsApp"
        : template.channel === "SMS"
          ? "Bulk SMS"
          : "Email campaigns";
    go(page);
    setModal(
      template.channel === "WhatsApp"
        ? "whatsapp"
        : template.channel === "SMS"
          ? "sms"
          : "email",
    );
    recordAudit("Used campaign template", template.name, "Template used");
  };
  const addTemplateDraft = (template: TemplateDraft) => {
    setTemplateDrafts((current) => [template, ...current]);
    const { name, channel } = template;
    recordAudit(
      "Created template draft",
      `${name} · ${channel}`,
      "Template draft",
    );
    setModal("");
    notify("Template draft saved in this preview");
  };
  const exportCsv = (rows: Contact[] = filtered) => {
    const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const csv = [
      "Name,Email,Alternate_Emails,Phone,Organization,Category,Location,Interests,Tags,Email_Consent_Status,SMS_Consent_Status",
      ...rows.map((c) =>
        [
          c.name,
          c.email,
          (c.alternateEmails ?? []).join("; "),
          c.phone ?? "",
          c.organization ?? "",
          c.category,
          c.location,
          (c.interests ?? []).join("; "),
          (c.tags ?? []).join("; "),
          c.status,
          c.smsStatus ?? "Pending",
        ]
          .map(escape)
          .join(","),
      ),
    ].join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "cephas-contacts.csv";
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    recordAudit(
      "Exported contacts",
      `${rows.length} contact records`,
      "Data export",
    );
    notify(`${rows.length} contact${rows.length === 1 ? "" : "s"} exported`);
  };
  const exportExcel = async (rows: Contact[] = filtered) => {
    const XLSX = await import("xlsx");
    const records = rows.map(
      ({
        name,
        email,
        alternateEmails,
        phone,
        organization,
        category,
        location,
        interests,
        tags,
        status,
        smsStatus,
      }) => ({
        Name: name,
        Email: email,
        Alternate_Emails: (alternateEmails ?? []).join("; "),
        Phone: phone ?? "",
        Organization: organization ?? "",
        Category: category,
        Location: location,
        Interests: (interests ?? []).join(", "),
        Tags: (tags ?? []).join(", "),
        Consent_Status: status,
        SMS_Consent_Status: smsStatus ?? "Pending",
      }),
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(records),
      "Contacts",
    );
    XLSX.writeFile(workbook, "cephas-contacts.xlsx");
    recordAudit(
      "Exported contacts",
      `${rows.length} contact records · Excel`,
      "Data export",
    );
    notify(
      `${rows.length} contact${rows.length === 1 ? "" : "s"} exported to Excel`,
    );
  };
  const importCsv = (file: File) => {
    const isExcel = /\.xlsx?$/i.test(file.name);
    const content = isExcel
      ? file.arrayBuffer().then(async (data) => {
          const XLSX = await import("xlsx");
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          return firstSheet ? XLSX.utils.sheet_to_csv(firstSheet) : "";
        })
      : file.text();
    void content
      .then(async (raw) => {
        const parseCsv = (input: string) => {
          const rows: string[][] = [];
          let row: string[] = [];
          let value = "";
          let quoted = false;
          for (let index = 0; index < input.length; index++) {
            const character = input[index];
            if (character === '"' && quoted && input[index + 1] === '"') {
              value += '"';
              index++;
            } else if (character === '"') {
              quoted = !quoted;
            } else if (character === "," && !quoted) {
              row.push(value.trim());
              value = "";
            } else if ((character === "\n" || character === "\r") && !quoted) {
              if (character === "\r" && input[index + 1] === "\n") index++;
              row.push(value.trim());
              if (row.some((cell) => cell.length > 0)) rows.push(row);
              row = [];
              value = "";
            } else value += character;
          }
          row.push(value.trim());
          if (row.some((cell) => cell.length > 0)) rows.push(row);
          return rows;
        };
        const [headerRow, ...lines] = parseCsv(raw.replace(/^\uFEFF/, ""));
        if (!headerRow) {
          notify("The selected CSV is empty");
          return;
        }
        const headers = headerRow.map((h) =>
          h.toLowerCase().replaceAll(/[\s-]+/g, "_"),
        );
        const index = (...keys: string[]) =>
          headers.findIndex((h) => keys.includes(h));
        const emailAt = index("email", "email_address");
        if (emailAt < 0) {
          notify("CSV needs an Email or Email address column");
          return;
        }
        const nameAt = index("name", "full_name"),
          firstAt = index("first_name", "firstname"),
          lastAt = index("last_name", "lastname", "surname"),
          categoryAt = index("category"),
          locationAt = index("location", "city"),
          consentAt = index(
            "consent_status",
            "marketing_consent",
            "email_consent_status",
          ),
          smsConsentAt = index("sms_consent_status", "sms_opt_in_status");
        const phoneAt = index("phone", "phone_number", "mobile"),
          organizationAt = index("organization", "organisation", "company"),
          interestsAt = index("interests", "interest"),
          tagsAt = index("tags", "tag");
        const alternateEmailsAt = index("alternate_emails", "alternate_email", "secondary_emails");
        const seen = new Set(contacts.map((c) => c.email.toLowerCase()));
        const seenPhones = new Set(
          contacts.map((c) => c.phone?.replace(/\D/g, "")).filter(Boolean),
        );
        let invalidCount = 0;
        let invalidPhoneCount = 0;
        let duplicateCount = 0;
        const additions = lines.flatMap((values, i) => {
          const email = (values[emailAt] || "").trim();
          const importedPhone =
            phoneAt >= 0 ? (values[phoneAt] ?? "").trim() : "";
          const normalizedPhone = importedPhone.replace(/\D/g, "");
          if (!/^\S+@\S+\.\S+$/.test(email)) {
            invalidCount++;
            return [];
          }
          if (
            importedPhone &&
            (normalizedPhone.length < 7 || normalizedPhone.length > 15)
          ) {
            invalidPhoneCount++;
            return [];
          }
          if (
            seen.has(email.toLowerCase()) ||
            (normalizedPhone.length >= 7 && seenPhones.has(normalizedPhone))
          ) {
            duplicateCount++;
            return [];
          }
          seen.add(email.toLowerCase());
          if (normalizedPhone.length >= 7) seenPhones.add(normalizedPhone);
          const name =
            (nameAt >= 0
              ? values[nameAt] ?? ""
              : `${values[firstAt] || ""} ${values[lastAt] || ""}`
            ).trim() || email.split("@")[0];
          const initials = name
            .split(/\s+/)
            .slice(0, 2)
            .map((v) => v[0]?.toUpperCase() || "")
            .join("");
          const consentValue =
            consentAt >= 0 ? values[consentAt]?.toLowerCase() : "";
          const status: Contact["status"] =
            consentValue === "subscribed" || consentValue === "consented"
              ? "Subscribed"
              : consentValue === "unsubscribed" || consentValue === "opted_out"
                ? "Unsubscribed"
                : "Pending";
          const smsConsentValue =
            smsConsentAt >= 0 ? values[smsConsentAt]?.toLowerCase() : "";
          const smsStatus: Contact["status"] =
            smsConsentValue === "subscribed" ||
            smsConsentValue === "consented" ||
            smsConsentValue === "opted_in"
              ? "Subscribed"
              : smsConsentValue === "unsubscribed" ||
                  smsConsentValue === "opted_out"
                ? "Unsubscribed"
                : "Pending";
          return [
            {
              name,
              email,
              alternateEmails: alternateEmailsAt >= 0 ? (values[alternateEmailsAt] ?? "").split(/[;,]/).map((value) => value.trim().toLowerCase()).filter(Boolean) : [],
              category:
                categoryAt >= 0 && values[categoryAt]
                  ? values[categoryAt]
                  : categories.includes("Prospect")
                    ? "Prospect"
                    : (categories[0] ?? "Uncategorized"),
              location:
                locationAt >= 0 && values[locationAt]
                  ? values[locationAt]
                  : "Not provided",
              phone: importedPhone || undefined,
              organization:
                organizationAt >= 0
                  ? values[organizationAt]?.trim() || undefined
                  : undefined,
              interests:
                interestsAt >= 0
                  ? (values[interestsAt] ?? "")
                      .split(/[;,]/)
                      .map((v) => v.trim())
                      .filter(Boolean)
                  : [],
              tags:
                tagsAt >= 0
                  ? (values[tagsAt] ?? "")
                      .split(/[;,]/)
                      .map((v) => v.trim())
                      .filter(Boolean)
                  : [],
              status,
              smsStatus,
              initials,
              color: ["lavender", "peach", "mint", "blue", "pink", "yellow"][
                i % 6
              ],
              date: new Date().toLocaleDateString(),
            } as Contact,
          ];
        });
        if (additions.length === 0) {
          notify(
            `Nothing imported · ${duplicateCount} duplicates, ${invalidCount} invalid emails, ${invalidPhoneCount} invalid phones skipped`,
          );
          return;
        }
        const importedContacts: ApiContact[] = [];
        let apiSkipped = 0;
        try {
          for (let start = 0; start < additions.length; start += 1000) {
            const result = await crmApi.importContacts(
              additions.slice(start, start + 1000).map(toApiContact),
            );
            importedContacts.push(...result.contacts);
            apiSkipped += result.skipped;
          }
        } catch (error) {
          const persistedPartial = importedContacts.map((contact) => contactFromApi(contact) as Contact);
          if (persistedPartial.length) {
            setContacts((current) => [...persistedPartial, ...current]);
            setAudienceReloadKey((key) => key + 1);
            setCategories((current) => Array.from(new Set([...current, ...persistedPartial.map((contact) => contact.category)])));
            setModal("");
            notify(`${persistedPartial.length} contacts imported before the import stopped: ${error instanceof Error ? error.message : "API error"}. You can retry the file; existing emails will be skipped.`);
            return;
          }
          throw error;
        }
        const persisted = importedContacts.map((contact) => contactFromApi(contact) as Contact);
        setContacts((current) => [...persisted, ...current]);
        setAudienceReloadKey((key) => key + 1);
        setCategories((current) => Array.from(new Set([...current, ...persisted.map((contact) => contact.category)])));
        const totalDuplicates = duplicateCount + apiSkipped;
        recordAudit(
          "Imported contacts",
          `${file.name} · ${persisted.length} imported · ${totalDuplicates} duplicates · ${invalidCount} invalid email · ${invalidPhoneCount} invalid phone`,
          "Contact import",
        );
        setModal("");
        notify(
          `${persisted.length} imported · ${totalDuplicates} duplicates, ${invalidCount} invalid emails, ${invalidPhoneCount} invalid phones skipped`,
        );
      })
      .catch((error: unknown) => notify(`Could not import contacts: ${error instanceof Error ? error.message : "check the file and API connection"}`));
  };
  const toggle = (email: string) =>
    setSelected((v) =>
      v.includes(email) ? v.filter((x) => x !== email) : [...v, email],
    );
  return (
    <div className="app-shell">
      <aside
        className={`sidebar ${mobile ? "open" : ""} ${sidebarCollapsed && !mobile ? "collapsed" : ""}`}
      >
        <div className="brand">
          <div className="brand-mark">
            <span>C</span>
          </div>
          <div>
            <b>cephas</b>
            <small>PEOPLE</small>
          </div>
          <button
            className="collapse"
            aria-label={
              sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
            aria-expanded={!sidebarCollapsed}
            onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
          >
            <ChevronLeft size={17} />
          </button>
        </div>
        <div className="nav-groups">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <p>{group.label}</p>
              {group.items.map((item) => (
                <button
                  key={item.name}
                  onClick={() => go(item.name)}
                  className={`nav-item ${page === item.name || (page === "Audience profile" && item.name === "Audiences") || (page === "Categories" && item.name === "Contacts") ? "active" : ""}`}
                >
                  <item.icon size={18} />
                  <span>{item.name}</span>
                  {item.name === "Contacts" && (
                    <span className="nav-count">{contacts.length}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
          <div className="nav-group">
            <p>COMING LATER</p>
            <button className="nav-item muted" onClick={() => go("Leads")}>
              <Activity size={18} />
              <span>Lead management</span>
              <span className="soon">Soon</span>
            </button>
          </div>
        </div>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => go("Settings")}>
            <Settings2 size={18} />
            <span>Settings</span>
          </button>
          <button className="nav-item help" onClick={() => go("Help centre")}>
            <CircleHelp size={18} />
            <span>Help centre</span>
            <ArrowUpRight size={14} />
          </button>
          <div className="profile">
            <div className="avatar user-avatar">{accountInitials}</div>
            <div>
              <b>{accountName}</b>
              <small>{account.email}</small>
            </div>
          </div>
        </div>
      </aside>
      {mobile && (
        <button
          className="scrim"
          onClick={() => setMobile(false)}
          aria-label="Close menu"
        />
      )}
      <main className="main-area">
        <header className="topbar">
          <button
            className="menu-toggle icon-btn"
            onClick={() => setMobile(true)}
            aria-label="Open navigation"
          >
            <Menu size={19} />
          </button>
          <div className="breadcrumb">
            <span>Cephas People</span>
            <span className="slash">/</span>
            <b>{page}</b>
          </div>
          <div className="top-actions">
            <button
              className="top-search"
              aria-label="Search contacts"
              onClick={() => {
                go("Contacts");
                window.setTimeout(
                  () => document.getElementById("contact-search")?.focus(),
                  0,
                );
              }}
            >
              <Search size={16} />
              <span>Search contacts...</span>
              <kbd>⌘ K</kbd>
            </button>
            <button
              className="icon-btn notification"
              aria-label="Notifications"
              onClick={() => go("Notifications")}
            >
              <Bell size={18} />
              <i />
            </button>
            <span className="top-divider" />
            <div className="avatar user-avatar">{accountInitials}</div>
            <div className="account-name">
              <b>{accountName}</b>
              <small>{account.email}</small>
            </div>
          </div>
        </header>
        <div className="content">
          {page === "Dashboard" && (
            <Dashboard setPage={go} period={period} setPeriod={setPeriod} />
          )}
          {page === "Contacts" && (
            <>
              <PageHeading
                eyebrow="YOUR PEOPLE, ALL IN ONE PLACE"
                title="Contacts"
                desc="Manage your relationships and keep every conversation personal."
                action={
                  <>
                    <button
                      className="btn secondary"
                      onClick={() => exportCsv()}
                    >
                      <ArrowDownToLine size={16} /> Export
                    </button>
                    <button
                      className="btn secondary"
                      onClick={() => void exportExcel()}
                    >
                      <ArrowDownToLine size={16} /> Excel
                    </button>
                    <button
                      className="btn secondary"
                      onClick={() => go("Categories")}
                    >
                      <Tag size={15} /> Manage categories
                    </button>
                    <button
                      className="btn primary"
                      onClick={() => setModal("add")}
                    >
                      <Plus size={17} /> Add contact
                    </button>
                  </>
                }
              />
              <div className="stats-grid compact-stats">
                <Stat
                  icon={<ContactRound />}
                  label="Total contacts"
                  value={String(contacts.length)}
                  change="Live"
                  hint="saved contact records"
                  color="lav"
                />
                <Stat
                  icon={<CheckCheck />}
                  label="Subscribed"
                  value={String(
                    contacts.filter((c) => c.status === "Subscribed").length,
                  )}
                  change="Live"
                  hint="saved records"
                  color="green"
                />
                <Stat
                  icon={<ShieldCheck />}
                  label="SMS opted in"
                  value={String(
                    contacts.filter((c) => c.smsStatus === "Subscribed").length,
                  )}
                  change="Live"
                  hint="saved SMS opt-ins"
                  color="orange"
                />
                <Stat
                  icon={<Users />}
                  label="Categories"
                  value={String(categories.length)}
                  change="Live"
                  hint="available categories"
                  color="blue"
                />
              </div>
              <section className="panel table-panel">
                <div className="panel-heading">
                  <div>
                    <h2>
                      Contacts{" "}
                      <span className="light-count">
                        {filtered.length} shown
                      </span>
                    </h2>
                    <p>Search, filter, and manage contact records saved in your CRM.</p>
                  </div>
                </div>
                <div className="table-toolbar">
                  <div className="search-input">
                    <Search size={16} />
                    <input
                      id="contact-search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search by name, email or location"
                    />
                    <kbd>⌘ K</kbd>
                  </div>
                  <select
                    aria-label="Filter by category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option>All categories</option>
                    {categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Filter by status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option>All statuses</option>
                    <option>Subscribed</option>
                    <option>Pending</option>
                    <option>Unsubscribed</option>
                  </select>
                  <select
                    aria-label="Sort contacts"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option>Recently added</option>
                    <option>Name A–Z</option>
                  </select>
                  <button
                    className="btn secondary import-btn"
                    onClick={() => setModal("import")}
                  >
                    <Plus size={15} /> Import CSV / Excel
                  </button>
                </div>
                {selectedVisible.length > 0 && (
                  <div className="selection-bar">
                    <span>{selectedVisible.length} selected</span>
                    <button
                      onClick={() =>
                        openAudienceBuilder(
                          filtered.filter((c) =>
                            selectedVisible.includes(c.email),
                          ),
                        )
                      }
                    >
                      Create static audience
                    </button>
                    <button
                      onClick={() =>
                        exportCsv(
                          filtered.filter((c) =>
                            selectedVisible.includes(c.email),
                          ),
                        )
                      }
                    >
                      Export selected
                    </button>
                    <button className="bulk-delete-action" onClick={() => setConfirmBulkDelete(true)}>
                      Delete selected
                    </button>
                    <button onClick={() => setSelected([])}>Clear</button>
                  </div>
                )}
                <div className="table-scroll">
                  {contactsLoading ? (
                    <div className="empty-state"><LoaderCircle size={20} className="auth-spinner" /><b>Loading CRM contacts</b><span>Fetching contacts and categories from the API.</span></div>
                  ) : contactsError ? (
                    <div className="empty-state" role="alert"><Activity size={20} /><b>Contacts could not be loaded</b><span>{contactsError}</span><button className="btn secondary" onClick={() => setContactsReloadKey((key) => key + 1)}>Retry</button></div>
                  ) : (
                    <>
                  <table>
                    <thead>
                      <tr>
                        <th>
                          <input
                            aria-label="Select all visible contacts"
                            type="checkbox"
                            checked={
                              visibleContacts.length > 0 &&
                              visibleContacts.every((c) =>
                                selectedVisible.includes(c.email),
                              )
                            }
                            onChange={() =>
                              setSelected(
                                visibleContacts.every((c) =>
                                  selectedVisible.includes(c.email),
                                )
                                  ? selected.filter(
                                      (email) =>
                                        !visibleContacts.some(
                                          (c) => c.email === email,
                                        ),
                                    )
                                  : [
                                      ...new Set([
                                        ...selected,
                                        ...visibleContacts.map((c) => c.email),
                                      ]),
                                    ],
                              )
                            }
                          />
                        </th>
                        <th>CONTACT</th>
                        <th>CATEGORY</th>
                        <th>LOCATION</th>
                        <th>STATUS</th>
                        <th>ADDED</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleContacts.map((c) => (
                        <tr key={c.email}>
                          <td>
                            <input
                              aria-label={`Select ${c.name}`}
                              type="checkbox"
                              checked={selected.includes(c.email)}
                              onChange={() => toggle(c.email)}
                            />
                          </td>
                          <td>
                            <button
                              className="contact-open"
                              onClick={() => openContactProfile(c)}
                              aria-label={`View ${c.name}'s profile`}
                            >
                              <div className="contact-cell">
                                <div className={`avatar ${c.color}`}>
                                  {c.initials}
                                </div>
                                <div>
                                  <b>{c.name}</b>
                                  <small>{c.email}</small>
                                </div>
                              </div>
                            </button>
                          </td>
                          <td>
                            <Badge tone="neutral">{c.category}</Badge>
                          </td>
                          <td>{c.location}</td>
                          <td>
                            <Badge tone={c.status}>{c.status}</Badge>
                          </td>
                          <td>{c.date}</td>
                          <td>
                            <button
                              className="icon-btn row-menu"
                              aria-label={`More options for ${c.name}`}
                              onClick={() => openContactProfile(c)}
                            >
                              <MoreHorizontal size={17} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filtered.length === 0 && !contactsLoading && !contactsError && (
                    <div className="empty-state">
                      {contacts.length === 0 ? <ContactRound size={20} /> : <Search size={20} />}
                      <b>{contacts.length === 0 ? "No contacts yet" : "No contacts match these filters"}</b>
                      <span>
                        {contacts.length === 0 ? "Add your first contact or import a contact file to get started." : "Change your search or clear a filter to see contacts."}
                      </span>
                      {contacts.length === 0 ? <button className="btn primary" onClick={() => setModal("add")}><Plus size={15} /> Add contact</button> : <button className="btn secondary" onClick={() => { setQuery(""); setCategory("All categories"); setStatusFilter("All statuses"); }}>Clear filters</button>}
                    </div>
                  )}
                    </>
                  )}
                </div>
                <div className="table-footer">
                  <span>
                    Showing <b>{filtered.length === 0 ? 0 : contactsPage * pageSize + 1}–{Math.min((contactsPage + 1) * pageSize, filtered.length)}</b> of {filtered.length} contacts
                  </span>
                  <div>
                    <button className="page-btn" disabled={contactsPage <= 0 || contactsLoading} onClick={() => setContactsPage((page) => Math.max(0, page - 1))}>
                      <ChevronLeft size={15} /> Previous
                    </button>
                    <span className="page-count">{contactsPage + 1} / {pageCount}</span>
                    <button className="page-btn" disabled={contactsPage >= pageCount - 1 || contactsLoading} onClick={() => setContactsPage((page) => Math.min(pageCount - 1, page + 1))}>
                      Next <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}
          {page === "Categories" && (
            <CategoryManager
              categories={categories}
              contacts={contacts}
              onBack={() => go("Contacts")}
              onCreate={createCategory}
              onRename={renameCategory}
              onDelete={deleteCategory}
            />
          )}
          {page === "Contact profile" && activeContact && (
            <ContactProfile
              contact={activeContact}
              activity={auditEvents.filter(
                (event) =>
                  `${event[1]} ${event[2]}`
                    .toLowerCase()
                    .includes(activeContact.email.toLowerCase()) ||
                  `${event[1]} ${event[2]}`
                    .toLowerCase()
                    .includes(activeContact.name.toLowerCase()),
              )}
              onBack={() => go("Contacts")}
              notify={notify}
              onEdit={() => {
                const key = activeContact.id || activeContact.email;
                window.history.pushState({}, "", `/contacts/${encodeURIComponent(key)}/edit`);
                setModal("edit-contact");
              }}
              onDelete={() => setContactToDelete(activeContact)}
              onStartCampaign={() =>
                openCampaignForAudience(activeContact.name)
              }
            />
          )}
          {page === "Contact profile" && !activeContact && (
            <PageHeading
              eyebrow="CONTACTS"
              title="Contact not found"
              desc="This contact may have been removed or the link may be incorrect."
              action={<button className="btn secondary" onClick={() => go("Contacts")}>Back to contacts</button>}
            />
          )}
          {page === "Audiences" && (
            <AudiencesPreview
              drafts={audienceDrafts}
              loading={audienceLoading}
              error={audienceError}
              retry={() => setAudienceReloadKey((key) => key + 1)}
              setModal={() => { setAudienceEditSeed(null); openAudienceBuilder(); }}
              onView={openAudienceDetails}
              openCampaign={openCampaignForAudience}
            />
          )}
          {page === "Audience profile" && audienceProfileLoading && (
            <div className="empty-state"><LoaderCircle size={20} className="auth-spinner" /><b>Loading audience</b><span>Fetching saved audience rules and members.</span></div>
          )}
          {page === "Audience profile" && audienceProfileError && (
            <div className="empty-state" role="alert"><Activity size={20} /><b>Audience could not be loaded</b><span>{audienceProfileError}</span><button className="btn secondary" onClick={() => setAudienceReloadKey((key) => key + 1)}>Retry</button></div>
          )}
          {page === "Audience profile" && activeAudience && !audienceProfileLoading && !audienceProfileError && (
            <AudienceProfile
              audience={activeAudience}
              contacts={contacts}
              onBack={() => go("Audiences")}
              openCampaign={openCampaignForAudience}
              onEdit={() => { setAudienceEditSeed(activeAudience); setSegmentSeedContacts(activeAudience.members); setModal("edit-audience"); }}
              onDelete={deleteActiveAudience}
              onAddMembers={(ids) => addMembersToAudience(activeAudience.id, ids)}
              onRemoveMember={(contactId) => removeAudienceMember(activeAudience.id, contactId)}
            />
          )}
          {page === "Audience profile" && !activeAudience && !audienceProfileLoading && !audienceProfileError && (
            <PageHeading
              eyebrow="AUDIENCES"
              title="Audience not found"
              desc="Open the audience list and choose a group to view its profile."
              action={<button className="btn secondary" onClick={() => go("Audiences")}>Back to audiences</button>}
            />
          )}
          {page === "Help centre" && (
            <HelpCentre onBack={() => go("Dashboard")} setPage={go} />
          )}
          {page === "Notifications" && (
            <NotificationsPage onBack={() => go("Dashboard")} />
          )}
          {page === "Email campaigns" && (
            <CampaignPageFunctional
              channel="Email"
              records={campaignRecords}
              setModal={setModal}
              notify={notify}
              recordAudit={recordAudit}
              requestApproval={requestCampaignApproval}
              duplicateCampaign={duplicateCampaign}
            />
          )}
          {page === "Bulk SMS" && (
            <CampaignPageFunctional
              channel="SMS"
              records={campaignRecords}
              setModal={setModal}
              notify={notify}
              recordAudit={recordAudit}
              requestApproval={requestCampaignApproval}
              duplicateCampaign={duplicateCampaign}
            />
          )}
          {page === "WhatsApp" && (
            <CampaignPageFunctional
              channel="WhatsApp"
              records={campaignRecords}
              setModal={setModal}
              notify={notify}
              recordAudit={recordAudit}
              requestApproval={requestCampaignApproval}
              duplicateCampaign={duplicateCampaign}
            />
          )}
          {page === "Templates" && (
            <TemplateLibrary
              drafts={templateDrafts}
              setModal={setModal}
              useTemplate={openCampaignFromTemplate}
            />
          )}
          {page === "Scheduled" && (
            <ScheduledPreview
              records={campaignRecords}
              notify={notify}
              setModal={setModal}
              cancelScheduled={cancelScheduled}
              togglePause={toggleScheduledPause}
            />
          )}
          {page === "Reports" && (
            <ReportsDashboard
              period={period}
              setPeriod={setPeriod}
              setPage={go}
            />
          )}
          {page === "Audit log" && (
            <AuditLogPreview
              events={auditEvents}
              notify={notify}
              recordAudit={recordAudit}
            />
          )}
          {page === "Settings" && (
            <Settings
              account={account}
              onSignOut={onSignOut}
              notify={notify}
              recordAudit={recordAudit}
            />
          )}
          {page === "Leads" && <ComingSoon />}
          <footer className="footer">
            <span>© 2026 Cephas People</span>
            <span>UI preview · no live provider connection</span>
            <span>Sample data · UI preview</span>
          </footer>
        </div>
      </main>
      {modal && (
        <ModalDialog
          kind={modal}
          close={() => {
            normalizeModalRoute();
            setModal("");
            setCampaignAudienceSeed("");
            setCampaignTemplateSeed(null);
            setAudienceEditSeed(null);
            setSegmentSeedContacts([]);
          }}
          save={addContact}
          saveContact={modal === "edit-contact" ? updateContact : addContact}
          initialContact={modal === "edit-contact" ? activeContact : null}
          campaignNames={campaignRecords.map((campaign) => campaign.name)}
          categories={categories}
          saveDraft={addCampaignDraft}
          saveAudience={addAudienceDraft}
          initialMembers={modal === "edit-audience" ? (audienceEditSeed?.members ?? []) : segmentSeedContacts}
          initialAudienceRecord={modal === "edit-audience" ? audienceEditSeed : null}
          initialAudience={campaignAudienceSeed}
          audienceOptions={[
            ...audienceDrafts.map((audience) => ({
              name: audience.name,
              detail:
                audience.type === "Static group"
                  ? `${audience.memberCount ?? audience.members.length} saved contacts`
                  : `${audience.memberCount ?? 0} matching contacts · ${audience.rules.length} conditions`,
            })),
          ]}
          initialTemplate={campaignTemplateSeed}
          contacts={contacts}
          saveTemplate={addTemplateDraft}
          importContacts={importCsv}
          recordAudit={recordAudit}
          notify={notify}
        />
      )}
      {pendingDuplicate && (
        <div
          className="modal-backdrop"
          onMouseDown={() => setPendingDuplicate(null)}
        >
          <section
            className="modal duplicate-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="duplicate-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <p className="eyebrow">CONTACT REVIEW</p>
                <h2 id="duplicate-title">Possible duplicate found</h2>
              </div>
              <button
                className="icon-btn"
                aria-label="Close duplicate review"
                onClick={() => setPendingDuplicate(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-fields">
              <p className="modal-note">
                <ShieldCheck size={15} /> These records share an email address
                or phone number. Review before merging so contact identity and
                consent stay accurate.
              </p>
              <div className="duplicate-compare">
                <article>
                  <small>Existing contact</small>
                  <b>{pendingDuplicate.existing.name}</b>
                  <span>{pendingDuplicate.existing.email}</span>
                  <span>
                    {pendingDuplicate.existing.phone || "No phone recorded"}
                  </span>
                  <Badge tone={pendingDuplicate.existing.status}>
                    {pendingDuplicate.existing.status}
                  </Badge>
                </article>
                <article>
                  <small>Incoming contact</small>
                  <b>{pendingDuplicate.incoming.name}</b>
                  <span>{pendingDuplicate.incoming.email}</span>
                  <span>
                    {pendingDuplicate.incoming.phone || "No phone recorded"}
                  </span>
                  <Badge tone={pendingDuplicate.incoming.status}>
                    {pendingDuplicate.incoming.status}
                  </Badge>
                </article>
              </div>
              <p className="duplicate-consent-note">
                Merge keeps the existing primary email and applies the stricter
                consent status. Other email addresses are retained as
                alternates.
              </p>
            </div>
            <div className="modal-foot">
              <button
                className="btn secondary"
                onClick={() => setPendingDuplicate(null)}
              >
                Cancel
              </button>
              {pendingDuplicate.existing.email.toLowerCase() !==
                pendingDuplicate.incoming.email.toLowerCase() && (
                <button
                  className="btn secondary"
                  onClick={keepDuplicateSeparate}
                >
                  Keep both
                </button>
              )}
              <button className="btn primary" onClick={mergeDuplicateContact}>
                Merge safely
              </button>
            </div>
          </section>
        </div>
      )}
      {contactToDelete && (
        <div className="category-confirm" role="alertdialog" aria-modal="true" aria-labelledby="delete-contact-title">
          <div className="category-confirm-card">
            <div className="danger-icon"><Trash2 size={18} /></div>
            <h2 id="delete-contact-title">Delete {contactToDelete.name}?</h2>
            <p>This permanently removes the contact record from your CRM. Any audience memberships for this contact will also be removed.</p>
            <div className="category-confirm-actions">
              <button className="btn secondary" onClick={() => setContactToDelete(null)}>Cancel</button>
              <button className="btn danger" onClick={() => void removeContact(contactToDelete)}>Delete contact</button>
            </div>
          </div>
        </div>
      )}
      {confirmBulkDelete && (
        <div className="category-confirm" role="alertdialog" aria-modal="true" aria-labelledby="delete-selected-title">
          <div className="category-confirm-card">
            <div className="danger-icon"><Trash2 size={18} /></div>
            <h2 id="delete-selected-title">Delete {selectedVisible.length} selected contacts?</h2>
            <p>This permanently removes these CRM records and removes them from saved audiences.</p>
            <div className="category-confirm-actions">
              <button className="btn secondary" onClick={() => setConfirmBulkDelete(false)}>Cancel</button>
              <button className="btn danger" onClick={() => void removeSelectedContacts()}>Delete contacts</button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className="toast">
          <Check size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}
function CategoryManager({
  categories,
  contacts,
  onBack,
  onCreate,
  onRename,
  onDelete,
}: {
  categories: string[];
  contacts: Contact[];
  onBack: () => void;
  onCreate: (name: string) => void;
  onRename: (previous: string, next: string) => void;
  onDelete: (name: string) => void;
}) {
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState("");
  const [editValue, setEditValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState("");
  const [error, setError] = useState("");
  const isDuplicate = (candidate: string, except = "") =>
    categories.some(
      (name) =>
        name !== except &&
        name.toLocaleLowerCase() === candidate.toLocaleLowerCase(),
    );
  const add = (event: React.FormEvent) => {
    event.preventDefault();
    const value = newName.trim();
    if (!value) return setError("Enter a category name.");
    if (isDuplicate(value))
      return setError("A category with this name already exists.");
    onCreate(value);
    setNewName("");
    setError("");
  };
  const saveRename = (previous: string) => {
    const value = editValue.trim();
    if (!value) return setError("Enter a category name.");
    if (isDuplicate(value, previous))
      return setError("A category with this name already exists.");
    if (value !== previous) onRename(previous, value);
    setEditing("");
    setError("");
  };
  return (
    <div className="category-manager-page">
      <PageHeading
        eyebrow="CONTACT ORGANIZATION"
        title="Categories"
        desc="Create and maintain the categories used to organize your contacts."
        action={
          <button className="btn secondary" onClick={onBack}>
            <ChevronLeft size={16} /> Back to contacts
          </button>
        }
      />
      <form className="panel category-create-form" onSubmit={add}>
        <div>
          <h2>Create a category</h2>
          <p>
            New categories are immediately available on contact records and
            filters.
          </p>
        </div>
        <label className="category-create-input">
          <span className="sr-only">Category name</span>
          <input
            value={newName}
            onChange={(event) => {
              setNewName(event.target.value);
              setError("");
            }}
            placeholder="e.g. Volunteer"
            maxLength={48}
          />
        </label>
        <button className="btn primary" type="submit">
          <Plus size={16} /> Add category
        </button>
      </form>
      {error && (
        <p className="validation-message category-error" role="alert">
          {error}
        </p>
      )}
      <section className="panel category-list-panel">
        <div className="panel-heading">
          <div>
            <h2>
              Contact categories{" "}
              <span className="light-count">{categories.length}</span>
            </h2>
            <p>
              Renaming a category updates contacts and saved audience rules.
            </p>
          </div>
        </div>
        <div className="category-list">
          {categories.map((name) => {
            const usage = contacts.filter(
              (contact) => contact.category === name,
            ).length;
            return (
              <div className="category-row" key={name}>
                {editing === name ? (
                  <>
                    <input
                      aria-label={`Rename ${name}`}
                      value={editValue}
                      onChange={(event) => {
                        setEditValue(event.target.value);
                        setError("");
                      }}
                      maxLength={48}
                    />
                    <span className="category-usage">{usage} contacts</span>
                    <button
                      className="btn primary"
                      onClick={() => saveRename(name)}
                    >
                      Save
                    </button>
                    <button
                      className="btn secondary"
                      onClick={() => {
                        setEditing("");
                        setError("");
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <div className="category-name">
                      <span className="category-dot" />
                      <b>{name}</b>
                    </div>
                    <span className="category-usage">
                      {usage} contact{usage === 1 ? "" : "s"}
                    </span>
                    <button
                      className="btn secondary"
                      onClick={() => {
                        setEditing(name);
                        setEditValue(name);
                        setError("");
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn danger-quiet"
                      disabled={categories.length <= 1}
                      onClick={() => {
                        setDeleteTarget(name);
                        setError("");
                      }}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>
      {deleteTarget && (
        <div
          className="category-confirm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-category-title"
        >
          <div className="category-confirm-card">
            <div className="danger-icon">
              <X size={18} />
            </div>
            <h2 id="delete-category-title">Delete “{deleteTarget}”?</h2>
            <p>
              {
                contacts.filter((contact) => contact.category === deleteTarget)
                  .length
              }{" "}
              assigned contacts will be moved to{" "}
              {categories.find((categoryName) => categoryName !== deleteTarget)}
              . Saved audience rules that use this category will be updated too.
            </p>
            <div className="category-confirm-actions">
              <button
                className="btn secondary"
                onClick={() => setDeleteTarget("")}
              >
                Keep category
              </button>
              <button
                className="btn danger"
                onClick={() => {
                  onDelete(deleteTarget);
                  setDeleteTarget("");
                }}
              >
                Delete category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function ContactProfile({
  contact,
  activity,
  onBack,
  notify,
  onEdit,
  onDelete,
  onStartCampaign,
}: {
  contact: Contact;
  activity: AuditEvent[];
  onBack: () => void;
  notify: (message: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onStartCampaign: () => void;
}) {
  const consentCopy =
    contact.status === "Subscribed"
      ? "Email consent is subscribed. Check the separate SMS opt-in before sending texts."
      : contact.status === "Pending"
        ? "Email consent is pending. Confirm permission before sending email; review SMS opt-in separately."
        : "This contact unsubscribed from email. Keep email suppressed and review SMS opt-in separately.";
  return (
    <div className="contact-profile-page">
      <PageHeading
        eyebrow="CONTACT PROFILE"
        title={contact.name}
        desc="A clear view of contact details, preferences, and relationship history."
        action={
          <>
            <button className="btn secondary" onClick={onBack}>
              <ChevronLeft size={16} /> Back to contacts
            </button>
            <button className="btn secondary" onClick={onEdit}>
              <SlidersHorizontal size={15} /> Edit contact
            </button>
            <button className="btn danger-quiet" onClick={onDelete}>
              <Trash2 size={15} /> Delete
            </button>
            <button className="btn primary" onClick={onStartCampaign}>
              <Send size={15} /> Create campaign
            </button>
          </>
        }
      />
      <section className="contact-profile-hero">
        <div className={`avatar profile-avatar ${contact.color}`}>
          {contact.initials}
        </div>
        <div className="contact-hero-copy">
          <div className="contact-hero-name">
            <h2>{contact.name}</h2>
            <Badge tone={contact.status}>{contact.status}</Badge>
          </div>
          <p>{contact.email}</p>
          <div className="contact-hero-meta">
            <Badge>{contact.category}</Badge>
            <span>
              <ContactRound size={14} /> {contact.location}
            </span>
            <span>
              <CalendarDays size={14} /> Added {contact.date}
            </span>
          </div>
        </div>
        <a
          className="btn secondary profile-email"
          href={`mailto:${contact.email}`}
        >
          <Mail size={15} /> Email contact
        </a>
      </section>
      <div className="contact-profile-grid">
        <section className="panel profile-details-panel">
          <div className="panel-title">
            <div>
              <h3>Contact details</h3>
              <p>Personal information on this record</p>
            </div>
            <ContactRound size={18} />
          </div>
          <div className="profile-details-grid">
            <div>
              <small>Full name</small>
              <b>{contact.name}</b>
            </div>
            <div>
              <small>Email address</small>
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
              {contact.alternateEmails?.map((address) => (
                <a
                  key={address}
                  className="alternate-email"
                  href={`mailto:${address}`}
                >
                  {address} <small>Alternate</small>
                </a>
              ))}
            </div>
            <div>
              <small>Phone number</small>
              <b className={contact.phone ? "" : "muted-value"}>
                {contact.phone || "Not provided"}
              </b>
            </div>
            <div>
              <small>Organization</small>
              <b className={contact.organization ? "" : "muted-value"}>
                {contact.organization || "Not provided"}
              </b>
            </div>
            <div>
              <small>Location</small>
              <b>{contact.location}</b>
            </div>
            <div>
              <small>Category</small>
              <b>{contact.category}</b>
            </div>
            <div>
              <small>Contact since</small>
              <b>{contact.date}</b>
            </div>
            <div>
              <small>Interests</small>
              <b className={contact.interests?.length ? "" : "muted-value"}>
                {contact.interests?.join(", ") || "None recorded"}
              </b>
            </div>
            <div className="profile-tags-field">
              <small>Tags</small>
              {contact.tags?.length ? (
                <div className="profile-tags">
                  {contact.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              ) : (
                <b className="muted-value">No tags</b>
              )}
            </div>
          </div>
        </section>
        <section className="panel consent-panel">
          <div className="panel-title">
            <div>
              <h3>Consent &amp; preferences</h3>
              <p>Communication eligibility</p>
            </div>
            <ShieldCheck size={18} />
          </div>
          <div className={`consent-callout ${contact.status.toLowerCase()}`}>
            <span className="consent-mark">
              <Check size={16} />
            </span>
            <div>
              <b>{contact.status} status</b>
              <p>{consentCopy}</p>
            </div>
          </div>
          <div className="consent-row">
            <span>Email communications</span>
            <Badge tone={contact.status}>{contact.status}</Badge>
          </div>
          <div className="consent-row">
            <span>SMS communications</span>
            <Badge tone={contact.smsStatus ?? "Pending"}>
              {contact.smsStatus ?? "No preference recorded"}
            </Badge>
          </div>
          <p className="profile-footnote">
            Update consent when the contact changes their communication
            preferences.
          </p>
        </section>
        <section className="panel activity-panel">
          <div className="panel-title">
            <div>
              <h3>Relationship activity</h3>
              <p>Recent engagement for this contact</p>
            </div>
            <Activity size={18} />
          </div>
          {activity.length > 0 ? (
            <div className="profile-activity-list">
              {activity.slice(0, 6).map((event, index) => (
                <div
                  className="profile-activity-item"
                  key={`${event[1]}-${index}`}
                >
                  <span className="activity-dot" />
                  <div>
                    <b>{event[1]}</b>
                    <small>{event[2]}</small>
                  </div>
                  <time>{event[4]}</time>
                </div>
              ))}
            </div>
          ) : (
            <div className="profile-empty-activity">
              <div>
                <Clock3 size={19} />
              </div>
              <b>No recent interactions</b>
              <p>
                Campaign opens, replies, and other engagement will appear here
                when activity data is connected.
              </p>
            </div>
          )}
        </section>
        <section className="profile-next-step">
          <div className="next-step-icon">
            <Sparkles size={18} />
          </div>
          <div>
            <b>Keep the conversation personal</b>
            <p>Use this contact’s details to create a relevant campaign.</p>
          </div>
          <button className="btn secondary" onClick={onStartCampaign}>
            Start a campaign <ArrowUpRight size={15} />
          </button>
        </section>
      </div>
    </div>
  );
}
function PageHeading({
  eyebrow,
  title,
  desc,
  action,
}: {
  eyebrow: string;
  title: string;
  desc: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-desc">{desc}</p>
      </div>
      <div className="heading-actions">{action}</div>
    </div>
  );
}
function Stat({
  icon,
  label,
  value,
  change,
  hint,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  hint: string;
  color: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <div className={`stat-icon ${color}`}>{icon}</div>
        <span className={change === "Manage" ? "manage-link" : "stat-change"}>
          {change !== "Manage" && <ArrowUpRight size={13} />}
          {change}
        </span>
      </div>
      <p>{label}</p>
      <div className="stat-bottom">
        <strong>{value}</strong>
        <small>{hint}</small>
      </div>
    </div>
  );
}
function Dashboard({
  setPage,
  period,
  setPeriod,
}: {
  setPage: (p: Page) => void;
  period: string;
  setPeriod: (s: string) => void;
}) {
  return (
    <>
      <PageHeading
        eyebrow="THURSDAY, NOVEMBER 13, 2026 · SAMPLE DATA"
        title="Good morning, Amara 👋"
        desc="Here’s what’s happening with your audience today."
        action={
          <>
            <button
              className="btn secondary"
              onClick={() => setPage("Reports")}
            >
              <ArrowUpRight size={16} /> View reports
            </button>
            <button
              className="btn primary"
              onClick={() => setPage("Email campaigns")}
            >
              <Plus size={17} /> Create campaign
            </button>
          </>
        }
      />
      <div className="welcome-banner">
        <div className="welcome-orb orb1" />
        <div className="welcome-orb orb2" />
        <div className="welcome-copy">
          <div className="banner-label">
            <Sparkles size={14} /> YOUR CRM AT A GLANCE
          </div>
          <h2>
            Good relationships start with
            <br />
            the right conversation.
          </h2>
          <p>Reach the people who matter, with messages that do too.</p>
          <button onClick={() => setPage("Contacts")}>
            Explore your audience <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="banner-art">
          <div className="art-circle">
            <div className="art-inner">
              <Mail size={31} />
            </div>
            <span className="art-bubble bubble-a">
              <Users size={18} />
            </span>
            <span className="art-bubble bubble-b">
              <MessageSquareText size={17} />
            </span>
            <span className="art-bubble bubble-c">
              <Sparkles size={16} />
            </span>
          </div>
        </div>
      </div>
      <div className="section-row">
        <div>
          <h2 className="section-title">Your workspace</h2>
          <p className="section-subtitle">A snapshot of your CRM activity.</p>
        </div>
        <select
          className="period-select"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>Last 90 days</option>
        </select>
      </div>
      <div className="stats-grid">
        <Stat
          icon={<ContactRound />}
          label="Total contacts"
          value="2,486"
          change="12.8%"
          hint="vs last month"
          color="lav"
        />
        <Stat
          icon={<Send />}
          label="Campaigns sent"
          value="18"
          change="16.4%"
          hint="vs last month"
          color="blue"
        />
        <Stat
          icon={<Mail />}
          label="Emails delivered"
          value="24.8k"
          change="8.2%"
          hint="vs last month"
          color="orange"
        />
        <Stat
          icon={<MessageSquareText />}
          label="SMS sent"
          value="3,642"
          change="4.6%"
          hint="vs last month"
          color="green"
        />
      </div>
      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Campaign performance</h2>
              <p>Delivery and engagement over time</p>
            </div>
            <button className="icon-btn" onClick={() => setPage("Reports")}>
              <MoreHorizontal size={19} />
            </button>
          </div>
          <div className="chart-legend">
            <span>
              <i className="legend-dot violet-dot" />
              Delivered
            </span>
            <span>
              <i className="legend-dot orange-dot" />
              Engagement
            </span>
            <span className="chart-total">
              <b>28.4k</b>
              <small>messages delivered</small>
            </span>
          </div>
          <PerformanceChart />
          <div className="chart-labels">
            <span>Oct 15</span>
            <span>Oct 20</span>
            <span>Oct 25</span>
            <span>Oct 30</span>
            <span>Nov 04</span>
            <span>Nov 09</span>
            <span>Nov 13</span>
          </div>
        </section>
        <section className="panel channel-panel">
          <div className="panel-heading">
            <div>
              <h2>Channel overview</h2>
              <p>How your messages are performing</p>
            </div>
            <button className="icon-btn" onClick={() => setPage("Reports")}>
              <ArrowUpRight size={17} />
            </button>
          </div>
          <div className="channel-item">
            <div className="channel-icon mail-icon">
              <Mail size={19} />
            </div>
            <div className="channel-info">
              <b>Email</b>
              <small>24,820 delivered</small>
            </div>
            <div className="channel-rate">
              <b>98.4%</b>
              <small>delivery rate</small>
            </div>
          </div>
          <div className="channel-track">
            <span className="email-track" />
          </div>
          <div className="channel-item">
            <div className="channel-icon sms-icon">
              <MessageSquareText size={19} />
            </div>
            <div className="channel-info">
              <b>SMS</b>
              <small>3,642 delivered</small>
            </div>
            <div className="channel-rate">
              <b>96.8%</b>
              <small>delivery rate</small>
            </div>
          </div>
          <div className="channel-track">
            <span className="sms-track" />
          </div>
          <div className="channel-item">
            <div className="channel-icon whatsapp-icon">
              <MessageCircle size={19} />
            </div>
            <div className="channel-info">
              <b>WhatsApp</b>
              <small>1,196 delivered · sample</small>
            </div>
            <div className="channel-rate">
              <b>72.6%</b>
              <small>read rate</small>
            </div>
          </div>
          <div className="channel-track">
            <span className="whatsapp-track" />
          </div>
          <div className="channel-foot">
            <span>
              <i className="live-dot" />
              Sample provider status
            </span>
            <b>
              Illustrative <Check size={14} />
            </b>
          </div>
        </section>
      </div>
      <section className="panel recent-panel">
        <div className="panel-heading">
          <div>
            <h2>Recent campaigns</h2>
            <p>Your latest communication activity.</p>
          </div>
          <button
            className="text-link"
            onClick={() => setPage("Email campaigns")}
          >
            View all campaigns <ArrowUpRight size={14} />
          </button>
        </div>
        <CampaignTable rows={campaigns.slice(0, 3)} />
      </section>
    </>
  );
}
function PerformanceChart() {
  return (
    <div className="chart-wrap">
      <div className="chart-y">
        <span>6k</span>
        <span>4k</span>
        <span>2k</span>
        <span>0</span>
      </div>
      <svg
        className="chart"
        viewBox="0 0 690 180"
        preserveAspectRatio="none"
        aria-label="Campaign performance trend"
      >
        <defs>
          <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#6854d9" stopOpacity=".18" />
            <stop offset="100%" stopColor="#6854d9" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0 133 C35 128 45 105 76 111 S120 135 150 106 S195 65 225 85 S270 119 300 79 S342 53 375 67 S418 104 450 73 S496 40 525 61 S570 94 600 49 S653 61 690 18 L690 180 L0 180Z"
          fill="url(#area)"
        />
        <path
          d="M0 133 C35 128 45 105 76 111 S120 135 150 106 S195 65 225 85 S270 119 300 79 S342 53 375 67 S418 104 450 73 S496 40 525 61 S570 94 600 49 S653 61 690 18"
          fill="none"
          stroke="#7460e7"
          strokeWidth="3"
        />
        <path
          d="M0 157 C40 152 47 143 76 149 S122 158 150 142 S193 127 225 133 S271 152 300 131 S344 122 375 128 S419 143 450 131 S495 117 525 127 S570 136 600 115 S653 125 690 98"
          fill="none"
          stroke="#f3a36f"
          strokeWidth="2.4"
          strokeDasharray="5 5"
        />
        <g fill="#fff" stroke="#7460e7" strokeWidth="2">
          <circle cx="150" cy="106" r="4" />
          <circle cx="300" cy="79" r="4" />
          <circle cx="450" cy="73" r="4" />
          <circle cx="600" cy="49" r="4" />
          <circle cx="690" cy="18" r="4" />
        </g>
      </svg>
    </div>
  );
}
function CampaignTable({
  rows,
  onRequestApproval,
  onDuplicate,
}: {
  rows: typeof campaigns;
  onRequestApproval?: (name: string) => void;
  onDuplicate?: (campaign: Campaign) => void;
}) {
  return (
    <div className="table-scroll">
      <table className="campaign-table">
        <thead>
          <tr>
            <th>CAMPAIGN</th>
            <th>CHANNEL</th>
            <th>AUDIENCE</th>
            <th>STATUS</th>
            <th>REACH</th>
            <th>ENGAGEMENT</th>
            <th>DATE</th>
            {(onRequestApproval || onDuplicate) && <th>ACTION</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.name}>
              <td>
                <div className="campaign-name">
                  <span className={`campaign-mark ${c.tone}`}>
                    {c.channel === "Email" ? (
                      <Mail size={15} />
                    ) : c.channel === "WhatsApp" ? (
                      <MessageCircle size={15} />
                    ) : (
                      <MessageSquareText size={15} />
                    )}
                  </span>
                  <b>{c.name}</b>
                </div>
              </td>
              <td>
                {c.channel === "Email" ? (
                  <span className="channel-label email-label">
                    <Mail size={14} />
                    Email
                  </span>
                ) : c.channel === "WhatsApp" ? (
                  <span className="channel-label whatsapp-label">
                    <MessageCircle size={14} />
                    WhatsApp
                  </span>
                ) : (
                  <span className="channel-label sms-label">
                    <MessageSquareText size={14} />
                    SMS
                  </span>
                )}
              </td>
              <td>{c.audience}</td>
              <td>
                <Badge tone={c.status}>{c.status}</Badge>
              </td>
              <td>{c.reach}</td>
              <td>{c.engagement}</td>
              <td>{c.date}</td>
              {(onRequestApproval || onDuplicate) && (
                <td>
                  {onRequestApproval && c.status === "Draft" ? (
                    <button
                      className="text-link"
                      onClick={() => onRequestApproval(c.name)}
                    >
                      Submit for approval
                    </button>
                  ) : onRequestApproval && c.status === "Pending approval" ? (
                    <Badge tone="Pending">In review</Badge>
                  ) : onRequestApproval ? (
                    <span className="muted-cell">—</span>
                  ) : null}
                  {onDuplicate && (
                    <button
                      className="text-link"
                      onClick={() => onDuplicate(c)}
                    >
                      Duplicate
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function CampaignPageFunctional({
  channel,
  records,
  setModal,
  notify,
  recordAudit,
  requestApproval,
  duplicateCampaign,
}: {
  channel: "Email" | "SMS" | "WhatsApp";
  records: typeof campaigns;
  setModal: (s: string) => void;
  notify: (s: string) => void;
  recordAudit: (activity: string, details: string, eventType: string) => void;
  requestApproval: (name: string) => void;
  duplicateCampaign: (campaign: Campaign) => void;
}) {
  const [status, setStatus] = useState("All");
  const isMail = channel === "Email",
    isWhatsApp = channel === "WhatsApp",
    channelTitle = isMail ? "Email" : isWhatsApp ? "WhatsApp" : "SMS",
    modalKind = isMail ? "email" : isWhatsApp ? "whatsapp" : "sms",
    allRows = records.filter((c) => c.channel === channel),
    rows = allRows.filter((c) => status === "All" || c.status === status);
  const counts = [
    "All",
    "Draft",
    "Pending approval",
    "Scheduled",
    "Paused",
    "Sent",
  ].map(
    (s) =>
      [s, allRows.filter((c) => s === "All" || c.status === s).length] as const,
  );
  const exportList = () => {
    const csv = [
      "Campaign,Channel,Audience,Status,Reach,Engagement,Date",
      ...rows.map((c) =>
        [c.name, c.channel, c.audience, c.status, c.reach, c.engagement, c.date]
          .map((v) => `"${v.replaceAll('"', '""')}"`)
          .join(","),
      ),
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `cephas-${channel.toLowerCase()}-campaigns.csv`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    recordAudit(
      "Exported campaigns",
      `${rows.length} ${channel} campaign records`,
      "Data export",
    );
    notify(`${rows.length} campaign${rows.length === 1 ? "" : "s"} exported`);
  };
  return (
    <>
      <PageHeading
        eyebrow="COMMUNICATIONS · SAMPLE DATA"
        title={
          isMail
            ? "Email campaigns"
            : isWhatsApp
              ? "WhatsApp campaigns"
              : "Bulk SMS"
        }
        desc={
          isMail
            ? "Create thoughtful email campaigns and newsletters your audience wants to open."
            : isWhatsApp
              ? "Create personal WhatsApp campaigns using approved business message templates."
              : "Reach your audience directly with personalised SMS campaigns."
        }
        action={
          <>
            <button className="btn secondary" onClick={exportList}>
              <ArrowDownToLine size={16} /> Export
            </button>
            <button className="btn primary" onClick={() => setModal(modalKind)}>
              <Plus size={17} /> Create {channelTitle} campaign
            </button>
          </>
        }
      />
      <div className="stats-grid compact-stats">
        <Stat
          icon={<Send />}
          label={
            isMail
              ? "Emails sent"
              : isWhatsApp
                ? "WhatsApp messages"
                : "Messages sent"
          }
          value={isMail ? "24,820" : isWhatsApp ? "1,248" : "3,642"}
          change="Sample"
          hint="this month"
          color="lav"
        />
        <Stat
          icon={<CheckCheck />}
          label="Delivered"
          value={isMail ? "24,422" : isWhatsApp ? "1,196" : "3,526"}
          change="Sample"
          hint="illustrative data"
          color="green"
        />
        <Stat
          icon={<TrendingUp />}
          label={
            isMail
              ? "Avg. click rate"
              : isWhatsApp
                ? "Read rate"
                : "Delivery rate"
          }
          value={isMail ? "6.8%" : isWhatsApp ? "72.6%" : "96.8%"}
          change="Sample"
          hint="illustrative data"
          color="blue"
        />
        <Stat
          icon={<Users />}
          label="Campaigns in preview"
          value={String(allRows.length)}
          change="Sample"
          hint="listed below"
          color="orange"
        />
      </div>
      <div className="campaign-callout">
        <div className="callout-icon">
          <Sparkles size={19} />
        </div>
        <div>
          <b>
            {isMail
              ? "Make your next email one to remember"
              : isWhatsApp
                ? "Start a personal WhatsApp conversation"
                : "A timely text makes all the difference"}
          </b>
          <p>
            {isMail
              ? "Pick a template, personalise your message and preview before it goes out."
              : isWhatsApp
                ? "Choose an audience and approved template. Review consent and message details before sending."
                : "Choose your audience, check message parts and estimated cost before sending."}
          </p>
        </div>
        <button className="btn secondary" onClick={() => setModal(modalKind)}>
          Start creating <ArrowUpRight size={15} />
        </button>
      </div>
      <section className="panel table-panel">
        <div className="panel-heading">
          <div>
            <h2>
              {channelTitle} campaigns{" "}
              <span className="light-count">{rows.length} shown</span>
            </h2>
            <p>
              Illustrative campaign records and local drafts for this UI
              preview.
            </p>
          </div>
        </div>
        <div className="tab-row">
          {counts.map(([name, count]) => (
            <button
              key={name}
              className={`tab ${status === name ? "active" : ""}`}
              onClick={() => setStatus(name)}
            >
              {name === "All" ? "All campaigns" : name}
              <span>{count}</span>
            </button>
          ))}
        </div>
        {rows.length ? (
          <CampaignTable
            rows={rows}
            onRequestApproval={requestApproval}
            onDuplicate={duplicateCampaign}
          />
        ) : (
          <div className="empty-state">
            <FileText size={20} />
            <b>No {status.toLowerCase()} campaigns</b>
            <span>
              There are no {status.toLowerCase()} campaigns in this sample
              dataset.
            </span>
            <button className="btn secondary" onClick={() => setStatus("All")}>
              Show all campaigns
            </button>
          </div>
        )}
        <div className="table-footer">
          <span>
            Showing <b>{rows.length}</b> of {allRows.length} preview campaigns
          </span>
        </div>
      </section>
    </>
  );
}
function AudienceProfile({ audience, contacts, onBack, openCampaign, onEdit, onDelete, onAddMembers, onRemoveMember }: {
  audience: AudienceRecord;
  contacts: Contact[];
  onBack: () => void;
  openCampaign: (name: string) => void;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onAddMembers: (contactIds: string[]) => Promise<void>;
  onRemoveMember: (contactId: string) => Promise<void>;
}) {
  const [addingMembers, setAddingMembers] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const memberIds = new Set(audience.members.map((member) => member.id).filter(Boolean));
  const availableContacts = contacts.filter((contact) => contact.id && !memberIds.has(contact.id));
  const saveMembers = async () => {
    if (!selectedIds.length) return;
    setBusy(true);
    try {
      await onAddMembers(selectedIds);
      setSelectedIds([]);
      setAddingMembers(false);
    } catch {
      // The parent displays API errors; preserve selection so it can be retried.
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="audience-profile-page">
      <PageHeading eyebrow="AUDIENCE DETAILS" title={audience.name} desc="Review this audience’s definition and membership before using it." action={<>
        <button className="btn secondary" onClick={onBack}><ChevronLeft size={16} /> Back to audiences</button>
        <button className="btn secondary" onClick={onEdit}><SlidersHorizontal size={15} /> Edit audience</button>
        <button className="btn danger-quiet" onClick={() => setConfirmDelete(true)}><Trash2 size={15} /> Delete</button>
        <button className="btn primary" onClick={() => openCampaign(audience.name)}><Send size={15} /> Use in campaign</button>
      </>} />
      <section className="audience-profile-hero">
        <div className={`audience-card-icon ${audience.tone}`}><Users size={21} /></div>
        <div className="audience-profile-copy"><div className="contact-hero-name"><h2>{audience.name}</h2><Badge tone={audience.type === "Dynamic segment" ? "Dynamic" : "neutral"}>{audience.type}</Badge></div><p>{audience.description || "No description provided."}</p><small>Last updated · {audience.updated}</small></div>
        <div className="audience-reach"><small>{audience.type === "Static group" ? "Saved members" : "Current matching contacts"}</small><strong>{audience.count}</strong><span>contacts</span></div>
      </section>
      <div className="audience-profile-grid">
        <section className="panel"><div className="panel-title"><div><h3>Audience definition</h3><p>{audience.type} criteria</p></div><Filter size={18} /></div>
          {audience.rules.length ? <div className="audience-rules-list">{audience.rules.map((rule, index) => <div className="audience-rule" key={`${rule.field}-${index}`}><span>{rule.field}</span><Badge>{rule.operator}</Badge><b>{rule.value}</b></div>)}</div> : <div className="audience-definition-copy"><div className="audience-rule-icon"><ListFilter size={16} /></div><p>{audience.description || "No rules are saved."}</p><small>{audience.type === "Dynamic segment" ? "Edit this audience to add matching rules." : "Static audiences use saved contact membership."}</small></div>}
        </section>
        <section className="panel audience-members-panel"><div className="panel-title"><div><h3>Members</h3><p>{audience.type === "Static group" ? "Contacts saved in this group" : "Contacts currently matching these rules"}</p></div>{audience.type === "Static group" && <button className="btn secondary" onClick={() => setAddingMembers((value) => !value)}><Plus size={15} /> Add contacts</button>}</div>
          {addingMembers && audience.type === "Static group" && <div className="audience-add-members">
            {availableContacts.length ? availableContacts.map((contact) => <label key={contact.id}><input type="checkbox" checked={Boolean(contact.id && selectedIds.includes(contact.id))} onChange={() => contact.id && setSelectedIds((current) => current.includes(contact.id!) ? current.filter((id) => id !== contact.id) : [...current, contact.id!])} /><span><b>{contact.name}</b><small>{contact.email}</small></span></label>) : <p>{contacts.length ? "All available contacts are already in this group." : "Add contacts to the CRM before building audience membership."}</p>}
            <div className="audience-add-actions"><button className="btn secondary" onClick={() => { setAddingMembers(false); setSelectedIds([]); }}>Cancel</button><button className="btn primary" disabled={!selectedIds.length || busy} onClick={() => void saveMembers()}>{busy ? "Saving…" : `Add ${selectedIds.length || "selected"}`}</button></div>
          </div>}
          {audience.members.length ? <div className="audience-member-list">{audience.members.map((member) => <div className="audience-member" key={member.id ?? member.email}><div className={`avatar ${member.color}`}>{member.initials}</div><span><b>{member.name}</b><small>{member.email}</small></span><Badge>{member.category}</Badge>{audience.type === "Static group" && member.id && <button className="icon-btn" aria-label={`Remove ${member.name} from audience`} disabled={busy} onClick={() => void onRemoveMember(member.id!)}><X size={14} /></button>}</div>)}</div> : <div className="profile-empty-activity audience-empty-members"><div><Users size={18} /></div><b>No contacts in this audience</b><p>{audience.type === "Dynamic segment" ? "No current contacts match these rules. Edit the audience to adjust its criteria." : "Add contacts to this static group to build its membership."}</p></div>}
        </section>
      </div>
      {confirmDelete && <div className="category-confirm" role="alertdialog" aria-modal="true" aria-labelledby="delete-audience-title"><div className="category-confirm-card"><div className="danger-icon"><Trash2 size={17} /></div><h2 id="delete-audience-title">Delete “{audience.name}”?</h2><p>This permanently deletes the audience and its saved membership. Contact records remain in your CRM.</p><div className="category-confirm-actions"><button className="btn secondary" disabled={busy} onClick={() => setConfirmDelete(false)}>Keep audience</button><button className="btn danger" disabled={busy} onClick={() => { setBusy(true); void onDelete().finally(() => setBusy(false)); }}>Delete audience</button></div></div></div>}
    </div>
  );
}
function AudiencesPreview({ drafts, loading, error, retry, setModal, onView, openCampaign }: {
  drafts: AudienceDraft[];
  loading: boolean;
  error: string;
  retry: () => void;
  setModal: (s: string) => void;
  onView: (audience: AudienceRecord) => void;
  openCampaign: (name: string) => void;
}) {
  const [kind, setKind] = useState("All audiences");
  const [search, setSearch] = useState("");
  const shown = drafts.filter((audience) => (kind === "All audiences" || (kind === "Dynamic segments" ? audience.type === "Dynamic segment" : audience.type === "Static group")) && `${audience.name} ${audience.description}`.toLowerCase().includes(search.toLowerCase()));
  return <>
    <PageHeading eyebrow="KNOW YOUR AUDIENCE" title="Audiences" desc="Build meaningful groups and reach the right people every time." action={<button className="btn primary" onClick={() => setModal("segment")}><Plus size={17} /> Create audience</button>} />
    <div className="audience-highlight"><div className="audience-highlight-icon"><Users size={23} /></div><div><b>Better targeting, stronger connections.</b><p>Create dynamic segments that update from contact records or maintain static groups by hand.</p></div><span className="text-link">Static group · dynamic segment</span></div>
    <div className="section-row audience-section"><div><h2 className="section-title">Audiences <span className="light-count">{drafts.length}</span></h2><p className="section-subtitle">Saved groups and dynamic segments from your CRM.</p></div><div className="audience-list-controls"><div className="search-input"><Search size={15} /><input aria-label="Search audiences" placeholder="Search audiences" value={search} onChange={(event) => setSearch(event.target.value)} /></div><select className="period-select" aria-label="Filter audience type" value={kind} onChange={(event) => setKind(event.target.value)}><option>All audiences</option><option>Dynamic segments</option><option>Static groups</option></select></div></div>
    <div className="audience-grid">
      {loading ? <div className="empty-state"><LoaderCircle size={20} className="auth-spinner" /><b>Loading audiences</b><span>Fetching saved groups and segments from the API.</span></div> : error ? <div className="empty-state" role="alert"><Activity size={20} /><b>Audiences could not be loaded</b><span>{error}</span><button className="btn secondary" onClick={retry}>Retry</button></div> : shown.length ? shown.map((audience, index) => {
        const record = audienceRecordFromApi({ id: audience.id, name: audience.name, type: audience.type === "Dynamic segment" ? "dynamic" : "static", description: audience.description, rules: audience.rules, memberCount: audience.memberCount ?? audience.members.length, createdAt: audience.updatedAt, updatedAt: audience.updatedAt }, audience.members);
        return <article className="panel audience-card" key={audience.id}><div className="audience-card-top"><div className={`audience-card-icon ${["violet", "orange", "blue", "green", "pink", "peach"][index % 6]}`}><Users size={18} /></div><Badge tone={audience.type === "Dynamic segment" ? "Dynamic" : "neutral"}>{audience.type}</Badge></div><h3>{audience.name}</h3><p>{audience.description || (audience.type === "Static group" ? "A manually maintained group of contacts." : `${audience.rules.length} saved matching conditions.`)}</p><div className="audience-card-bottom"><span><b>{audience.memberCount ?? audience.members.length}</b> contacts</span><small>Updated {new Date(audience.updatedAt).toLocaleDateString()}</small></div><div className="audience-card-actions"><button onClick={() => onView(record)}>View audience <ArrowUpRight size={14} /></button><button onClick={() => openCampaign(audience.name)}>Use in campaign <ChevronRight size={14} /></button></div></article>;
      }) : <div className="empty-state"><Users size={20} /><b>{drafts.length ? "No audiences match this search" : "No audiences yet"}</b><span>{drafts.length ? "Change the search or audience type filter." : "Create a static group or dynamic segment to get started."}</span>{!drafts.length && <button className="btn primary" onClick={() => setModal("segment")}><Plus size={15} /> Create audience</button>}</div>}
    </div>
  </>;
}const templateSamples = [
  [
    "Welcome to Cephas",
    "A warm welcome for new subscribers.",
    "Welcome",
    "violet",
    "12 uses",
    "Email",
    "Welcome to Cephas, {{first_name}}",
    "Hi {{first_name}},\n\nThanks for joining the Cephas community. We’re glad you’re here.",
  ],
  [
    "Monthly newsletter",
    "A clean layout for your monthly updates.",
    "Newsletter",
    "orange",
    "8 uses",
    "Email",
    "The latest from Cephas",
    "Hello {{first_name}},\n\nHere are this month’s updates, ideas, and upcoming opportunities.",
  ],
  [
    "Training announcement",
    "Promote a new course or upcoming cohort.",
    "Promotion",
    "blue",
    "6 uses",
    "Email",
    "Build your next skill with Cephas",
    "Hi {{first_name}},\n\nRegistration is open for our upcoming training. Explore the programme and reserve your place.",
  ],
  [
    "Event invitation",
    "Bring your community together.",
    "Event",
    "green",
    "4 uses",
    "Email",
    "You’re invited, {{first_name}}",
    "We’d love to see you at our upcoming event. Save your place and join the conversation.",
  ],
  [
    "Alumni update",
    "Share news with your growing alumni network.",
    "Newsletter",
    "pink",
    "3 uses",
    "Email",
    "A quick alumni update",
    "Hello {{first_name}},\n\nSee what’s new in the alumni community and share your latest news with us.",
  ],
  [
    "Quick SMS reminder",
    "A friendly nudge, right on time.",
    "SMS",
    "peach",
    "9 uses",
    "SMS",
    "",
    "Hi {{first_name}}, a quick reminder from Cephas: your upcoming programme is around the corner. We look forward to seeing you!",
  ],
  [
    "Programme welcome message",
    "A personal WhatsApp welcome for new programme enquiries.",
    "Welcome",
    "green",
    "New",
    "WhatsApp",
    "",
    "Hi {{first_name}}, thanks for reaching out to Cephas. Reply to this message if you have any questions about the programme.",
  ],
] as const;
function TemplateLibrary({
  setModal,
  drafts,
  useTemplate,
}: {
  setModal: (s: string) => void;
  drafts: TemplateDraft[];
  useTemplate: (template: TemplateDraft) => void;
}) {
  const [filter, setFilter] = useState("All templates");
  const draftRows = drafts.map(
    (draft) =>
      [
        draft.name,
        "Saved locally; template content editing requires a connected editor.",
        "Custom",
        "violet",
        "Saved in preview",
        draft.channel,
        draft.subject,
        draft.body,
      ] as const,
  );
  const allTemplates = [...templateSamples, ...draftRows];
  const shown = allTemplates.filter(
    (row, i) =>
      filter === "All templates" ||
      (filter === "SMS"
        ? row[5] === "SMS"
        : filter === "WhatsApp"
          ? row[5] === "WhatsApp"
          : filter === "Email"
            ? row[5] === "Email"
            : [0, 2, 5].includes(i) || i >= templateSamples.length),
  );
  const filters = ["All templates", "Email", "SMS", "WhatsApp", "My templates"];
  return (
    <>
      <PageHeading
        eyebrow="MAKE IT YOURS · SAMPLE LIBRARY"
        title="Templates"
        desc="Start with a polished template and make it unmistakably Cephas."
        action={
          <button className="btn primary" onClick={() => setModal("template")}>
            <Plus size={17} /> Create template
          </button>
        }
      />
      <div className="template-tabs">
        {filters.map((value) => (
          <button
            key={value}
            className={`tab ${filter === value ? "active" : ""}`}
            onClick={() => setFilter(value)}
          >
            {value}
            <span>
              {value === "All templates"
                ? allTemplates.length
                : value === "Email"
                  ? allTemplates.filter((row) => row[5] === "Email").length
                  : value === "SMS"
                    ? allTemplates.filter((row) => row[5] === "SMS").length
                    : value === "WhatsApp"
                      ? allTemplates.filter((row) => row[5] === "WhatsApp")
                          .length
                      : Math.min(3, templateSamples.length) + drafts.length}
            </span>
          </button>
        ))}
      </div>
      <div className="template-grid">
        {shown.map(
          ([name, desc, type, tone, uses, channel, subject, body], i) => (
            <article className="panel template-card" key={name}>
              <div className={`template-preview ${tone}`}>
                <div className="preview-top">
                  <div className="preview-brand">
                    <span>C</span> cephas
                  </div>
                  <span className="preview-dots">•••</span>
                </div>
                <div className="preview-content">
                  <div className={`preview-art art-${i + 1}`}>
                    {channel === "WhatsApp" ? (
                      <MessageCircle size={25} />
                    ) : channel === "SMS" ? (
                      <MessageSquareText size={25} />
                    ) : (
                      <Mail size={25} />
                    )}
                  </div>
                  <div className="preview-line wide" />
                  <div className="preview-line medium" />
                  <div className="preview-line short" />
                  <span className="preview-cta">
                    {i === 0
                      ? "Get started"
                      : i === 1
                        ? "Read more"
                        : "Learn more"}
                  </span>
                </div>
                <span className="preview-tag">{channel}</span>
              </div>
              <div className="template-card-meta">
                <div>
                  <h3>{name}</h3>
                  <p>{desc}</p>
                </div>
              </div>
              <div className="template-card-foot">
                <small>
                  {uses} · {type}
                </small>
                <button
                  onClick={() => useTemplate({ name, channel, subject, body })}
                >
                  Use template <ArrowUpRight size={14} />
                </button>
              </div>
            </article>
          ),
        )}
      </div>
      {shown.length === 0 && (
        <div className="empty-state">
          <FileText size={20} />
          <b>No templates in this filter</b>
          <span>This preview has no saved templates in that category.</span>
          <button
            className="btn secondary"
            onClick={() => setFilter("All templates")}
          >
            Show all templates
          </button>
        </div>
      )}
    </>
  );
}
function ReportsDashboard({
  period,
  setPeriod,
  setPage,
}: {
  period: string;
  setPeriod: (s: string) => void;
  setPage: (p: Page) => void;
}) {
  const exportReport = () => {
    const csv = [
      "Metric,Value,Period",
      "Messages sent,28462,Sample",
      "Delivered,27948,Sample",
      "Unique clicks,1842,Sample",
      "Unsubscribes,24,Sample",
      ...campaigns.map((c) => `${c.name},${c.reach},${c.date}`),
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "cephas-sample-report.csv";
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <>
      <PageHeading
        eyebrow="SAMPLE REPORT · ILLUSTRATIVE METRICS"
        title="Reports & analytics"
        desc="Understand what resonates and make your next campaign even better."
        action={
          <>
            <select
              className="period-select"
              aria-label="Report period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
            <button className="btn secondary" onClick={exportReport}>
              <Download size={16} /> Export CSV
            </button>
          </>
        }
      />
      <div className="stats-grid compact-stats">
        <Stat
          icon={<Send />}
          label="Messages sent"
          value="28,462"
          change="Sample"
          hint={period}
          color="lav"
        />
        <Stat
          icon={<CheckCheck />}
          label="Delivered"
          value="27,948"
          change="Sample"
          hint="illustrative data"
          color="green"
        />
        <Stat
          icon={<TrendingUp />}
          label="Unique clicks"
          value="1,842"
          change="Sample"
          hint="illustrative data"
          color="blue"
        />
        <Stat
          icon={<ShieldCheck />}
          label="Unsubscribes"
          value="24"
          change="Sample"
          hint="illustrative data"
          color="orange"
        />
      </div>
      <div className="report-grid">
        <section className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Delivery & engagement</h2>
              <p>Illustrative trend · {period}</p>
            </div>
          </div>
          <div className="chart-legend">
            <span>
              <i className="legend-dot violet-dot" />
              Delivered
            </span>
            <span>
              <i className="legend-dot orange-dot" />
              Clicks
            </span>
          </div>
          <PerformanceChart />
          <div className="chart-labels">
            <span>Oct 15</span>
            <span>Oct 20</span>
            <span>Oct 25</span>
            <span>Oct 30</span>
            <span>Nov 04</span>
            <span>Nov 09</span>
            <span>Nov 13</span>
          </div>
        </section>
        <section className="panel report-side">
          <div className="panel-heading">
            <div>
              <h2>Channel performance</h2>
              <p>Sample delivery rates</p>
            </div>
          </div>
          <div className="report-channel">
            <span className="channel-icon mail-icon">
              <Mail size={17} />
            </span>
            <div>
              <b>Email</b>
              <small>24,820 sent · sample</small>
            </div>
            <strong>98.4%</strong>
          </div>
          <div className="report-bar">
            <i style={{ width: "98.4%" }} />
          </div>
          <div className="report-channel">
            <span className="channel-icon sms-icon">
              <MessageSquareText size={17} />
            </span>
            <div>
              <b>SMS</b>
              <small>3,642 sent · sample</small>
            </div>
            <strong>96.8%</strong>
          </div>
          <div className="report-bar sms-bar">
            <i style={{ width: "96.8%" }} />
          </div>
          <div className="report-channel">
            <span className="channel-icon whatsapp-icon">
              <MessageCircle size={17} />
            </span>
            <div>
              <b>WhatsApp</b>
              <small>1,248 sent · sample</small>
            </div>
            <strong>72.6%</strong>
          </div>
          <div className="report-bar whatsapp-bar">
            <i style={{ width: "72.6%" }} />
          </div>
          <div className="report-insight">
            <Sparkles size={16} />
            <span>
              Delivery rates are examples only and are not connected to a live
              provider.
            </span>
          </div>
        </section>
      </div>
      <section className="panel recent-panel">
        <div className="panel-heading">
          <div>
            <h2>Campaign performance</h2>
            <p>Illustrative results across recent sample sends.</p>
          </div>
          <button
            className="text-link"
            onClick={() => setPage("Email campaigns")}
          >
            View campaigns <ArrowUpRight size={14} />
          </button>
        </div>
        <CampaignTable rows={campaigns} />
      </section>
      <p className="compliance-note">
        <i className="info-dot">i</i> Email opens are estimates and may be
        inflated or unavailable due to privacy features. Clicks and conversions
        are stronger engagement signals.
      </p>
    </>
  );
}
function ScheduledPreview({
  records,
  notify,
  setModal,
  cancelScheduled,
  togglePause,
}: {
  records: Campaign[];
  notify: (s: string) => void;
  setModal: (s: string) => void;
  cancelScheduled: (name: string) => void;
  togglePause: (name: string, paused: boolean) => void;
}) {
  const [calendar, setCalendar] = useState(false);
  const items = records
    .filter(
      (campaign) =>
        campaign.status === "Scheduled" || campaign.status === "Paused",
    )
    .map((campaign) => ({
      ...campaign,
      when: campaign.scheduledAt
        ? `${new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }).format(new Date(campaign.scheduledAt))} WAT`
        : `${campaign.date} · sample time WAT`,
    }));
  const days = [
    "Fri 13",
    "Sat 14",
    "Sun 15",
    "Mon 16",
    "Tue 17",
    "Wed 18",
    "Thu 19",
  ];
  return (
    <>
      <PageHeading
        eyebrow="SCHEDULED · SAMPLE DATA"
        title="Scheduled campaigns"
        desc="Review the upcoming campaign schedule in this UI preview."
        action={
          <button className="btn primary" onClick={() => setModal("email")}>
            <Plus size={16} /> Create campaign
          </button>
        }
      />
      {items.length > 0 && (
        <div className="scheduled-banner">
          <div className="schedule-calendar">
            <span>NOV</span>
            <b>{items[0].date.split(" ")[1]?.replace(",", "")}</b>
            <small>
              {items[0].date.includes("14")
                ? "SAT"
                : items[0].date.includes("15")
                  ? "SUN"
                  : "WED"}
            </small>
          </div>
          <div className="scheduled-message">
            <Badge tone="Scheduled">NEXT SCHEDULED</Badge>
            <h2>{items[0].name}</h2>
            <p>Illustrative scheduled campaign · {items[0].audience}.</p>
            <div className="scheduled-details">
              <span>
                {items[0].channel === "Email" ? (
                  <Mail size={14} />
                ) : items[0].channel === "WhatsApp" ? (
                  <MessageCircle size={14} />
                ) : (
                  <MessageSquareText size={14} />
                )}{" "}
                {items[0].channel}
              </span>
              <span>
                <Clock3 size={14} /> {items[0].when}
              </span>
            </div>
          </div>
        </div>
      )}
      <div className="section-row">
        <div>
          <h2 className="section-title">
            Upcoming <span className="light-count">{items.length}</span>
          </h2>
          <p className="section-subtitle">
            Sample schedule shown in West Africa Time (UTC+1).
          </p>
        </div>
        <button
          className="btn secondary"
          onClick={() => setCalendar((value) => !value)}
        >
          <CalendarDays size={15} /> {calendar ? "List view" : "Calendar view"}
        </button>
      </div>
      {calendar ? (
        <div className="schedule-calendar-grid">
          {days.map((day) => {
            const dayNumber = day.split(" ")[1];
            const events = items.filter(
              (item) => item.date === `Nov ${dayNumber}, 2026`,
            );
            return (
              <div className="schedule-day" key={day}>
                <b>{day}</b>
                {events.map((item) => (
                  <div className="schedule-event" key={item.name}>
                    <b>{item.name}</b>
                    <small>
                      {item.when.split(" · ")[1]} · {item.channel}
                    </small>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <section className="panel scheduled-list">
          {items.length === 0 ? (
            <div className="empty-state">
              <CalendarDays size={20} />
              <b>No upcoming sample campaigns</b>
              <span>
                Create a draft campaign to explore the scheduling flow.
              </span>
              <button
                className="btn secondary"
                onClick={() => setModal("email")}
              >
                Create campaign
              </button>
            </div>
          ) : (
            items.map((item) => (
              <article className="scheduled-row" key={item.name}>
                <div className={`campaign-mark ${item.tone}`}>
                  {item.channel === "Email" ? (
                    <Mail size={16} />
                  ) : item.channel === "WhatsApp" ? (
                    <MessageCircle size={16} />
                  ) : (
                    <MessageSquareText size={16} />
                  )}
                </div>
                <div className="scheduled-row-main">
                  <b>{item.name}</b>
                  <small>{item.audience}</small>
                </div>
                <div className="scheduled-row-date">
                  <Clock3 size={14} />
                  {item.when}
                </div>
                <Badge tone={item.status}>{item.status}</Badge>
                <button
                  className="btn secondary"
                  onClick={() =>
                    togglePause(item.name, item.status !== "Paused")
                  }
                >
                  {item.status === "Paused" ? "Resume" : "Pause"}
                </button>
                <button
                  className="btn secondary cancel-schedule"
                  onClick={() => cancelScheduled(item.name)}
                >
                  Cancel schedule
                </button>
              </article>
            ))
          )}
        </section>
      )}
      <p className="compliance-note">
        <ShieldCheck size={16} /> Suppression checks must run immediately before
        any real send.
      </p>
    </>
  );
}
function AuditLogPreview({
  events,
  notify,
  recordAudit,
}: {
  events: AuditEvent[];
  notify: (s: string) => void;
  recordAudit: (activity: string, details: string, eventType: string) => void;
}) {
  const [query, setQuery] = useState(""),
    [kind, setKind] = useState("All activity");
  const shown = events.filter(
    (r) =>
      r.join(" ").toLowerCase().includes(query.toLowerCase()) &&
      (kind === "All activity" || r[3] === kind),
  );
  const exportLog = () => {
    const csv = [
      "User,Activity,Details,Event type,Date and time",
      ...shown.map((r) =>
        r
          .slice(0, 5)
          .map((v) => `"${v.replaceAll('"', '""')}"`)
          .join(","),
      ),
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "cephas-audit-preview.csv";
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    recordAudit("Exported audit log", `${shown.length} events`, "Data export");
    notify(`${shown.length} preview audit events exported`);
  };
  return (
    <>
      <PageHeading
        eyebrow="SAMPLE ACTIVITY · UI PREVIEW"
        title="Audit log"
        desc="Review illustrative CRM activity with an actor, action, event type and timestamp."
        action={
          <button className="btn secondary" onClick={exportLog}>
            <ArrowDownToLine size={16} /> Export visible events
          </button>
        }
      />
      <div className="audit-callout">
        <div className="audit-shield">
          <ShieldCheck size={21} />
        </div>
        <div>
          <b>Audit log interface preview</b>
          <p>
            These sample events show the activity details the connected
            application should record.
          </p>
        </div>
        <Badge tone="neutral">Illustrative data</Badge>
      </div>
      <section className="panel table-panel audit-panel">
        <div className="panel-heading">
          <div>
            <h2>
              Sample activity{" "}
              <span className="light-count">{shown.length} shown</span>
            </h2>
            <p>Filter the sample rows or export the visible events.</p>
          </div>
          <div className="audit-filters">
            <div className="search-input">
              <Search size={15} />
              <input
                aria-label="Search audit events"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search events"
              />
            </div>
            <select
              aria-label="Filter audit event type"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              <option>All activity</option>
              {[...new Set(auditRows.map((r) => r[3]))].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="table-scroll">
          <table className="audit-table">
            <thead>
              <tr>
                <th>USER</th>
                <th>ACTIVITY</th>
                <th>DETAILS</th>
                <th>EVENT TYPE</th>
                <th>DATE & TIME</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r, i) => (
                <tr key={`${r[0]}-${r[1]}`}>
                  <td>
                    <div className="contact-cell">
                      <div
                        className={`avatar ${["lavender", "peach", "mint", "blue", "pink", "yellow"][i % 6]}`}
                      >
                        {r[0]
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <b>{r[0]}</b>
                    </div>
                  </td>
                  <td>
                    <span className="audit-action">
                      <i className={`event-dot ${r[5]}`} />
                      {r[1]}
                    </span>
                  </td>
                  <td>{r[2]}</td>
                  <td>
                    <Badge tone="neutral">{r[3]}</Badge>
                  </td>
                  <td>{r[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {shown.length === 0 && (
            <div className="empty-state">
              <Search size={20} />
              <b>No activity matches this filter</b>
              <span>Try another search term or event type.</span>
              <button
                className="btn secondary"
                onClick={() => {
                  setQuery("");
                  setKind("All activity");
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
        <div className="table-footer">
          <span>
            Showing <b>{shown.length}</b> of {events.length} preview events
          </span>
          <span>Pagination requires connected audit data</span>
        </div>
      </section>
      <p className="compliance-note">
        <ShieldCheck size={16} /> Persistent audit records, retention rules and
        actor identity must be implemented with the backend.
      </p>
    </>
  );
}
function Settings({
  account,
  onSignOut,
  notify,
  recordAudit,
}: {
  account: { name: string; email: string };
  onSignOut: () => Promise<void>;
  notify: (s: string) => void;
  recordAudit: (activity: string, details: string, eventType: string) => void;
}) {
  const tabs = [
    "General",
    "Users & roles",
    "Consent & suppression",
    "Security & privacy",
    "Integrations",
  ];
  const [tab, setTab] = useState("General");
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("Cephas People");
  const [timezone, setTimezone] = useState("Africa/Lagos");
  const [senderName, setSenderName] = useState("Cephas People");
  const [users, setUsers] = useState<TeamUser[]>(loadTeamUsers);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("Marketing Staff");
  const [inviteError, setInviteError] = useState("");
  const [editingPermissions, setEditingPermissions] = useState("");
  const [openProvider, setOpenProvider] = useState("");
  const [twoFactorRequired] = useState(true);
  const [privacyRequestType, setPrivacyRequestType] = useState("Access");
  const [privacyRequestEmail, setPrivacyRequestEmail] = useState("");
  const [privacyRequests, setPrivacyRequests] = useState<
    { type: string; email: string; date: string; status: string }[]
  >([]);
  const isSuperadmin = users.some(
    (user) => user.email === "amara@cephas.ng" && user.role === "Superadmin",
  );
  useEffect(() => {
    try {
      localStorage.setItem("cephas.team-users", JSON.stringify(users));
    } catch {
      // Keep the access editor usable when browser storage is unavailable.
    }
  }, [users]);
  const changeRole = (email: string, role: TeamRole) => {
    setUsers((current) =>
      current.map((user) =>
        user.email === email
          ? { ...user, role, permissions: [...rolePermissions[role]] }
          : user,
      ),
    );
    const user = users.find((item) => item.email === email);
    if (user)
      recordAudit(
        "Updated team role",
        `${user.name} · ${role}`,
        "Team access updated",
      );
  };
  const togglePermission = (email: string, permission: PermissionId) => {
    const user = users.find((item) => item.email === email);
    if (!user || user.role === "Superadmin") return;
    const enabled = user.permissions.includes(permission);
    setUsers((current) =>
      current.map((item) =>
        item.email === email
          ? {
              ...item,
              permissions: enabled
                ? item.permissions.filter((value) => value !== permission)
                : [...item.permissions, permission],
            }
          : item,
      ),
    );
    const label =
      permissionCatalog.find((item) => item.id === permission)?.label ??
      permission;
    recordAudit(
      `${enabled ? "Removed" : "Granted"} permission`,
      `${label} · ${user.email}`,
      "Team permission updated",
    );
  };
  const resetPermissions = (email: string) => {
    const user = users.find((item) => item.email === email);
    if (!user || user.role === "Superadmin") return;
    setUsers((current) =>
      current.map((item) =>
        item.email === email
          ? { ...item, permissions: [...rolePermissions[item.role]] }
          : item,
      ),
    );
    recordAudit(
      "Reset role permissions",
      `${user.email} · ${user.role} defaults`,
      "Team permission updated",
    );
  };
  return (
    <>
      <PageHeading
        eyebrow="YOUR WORKSPACE"
        title="Settings"
        desc="Manage your CRM workspace, access and communication preferences."
      />
      <div className="settings-layout">
        <nav className="settings-nav">
          {tabs.map((t, i) => (
            <button
              className={tab === t ? "active" : ""}
              onClick={() => setTab(t)}
              key={t}
            >
              {
                [
                  <Settings2 size={16} />,
                  <Users size={16} />,
                  <ShieldCheck size={16} />,
                  <ShieldCheck size={16} />,
                  <Blocks size={16} />,
                ][i]
              }
              {t}
            </button>
          ))}
        </nav>
        <section className="panel settings-panel">
          <div className="settings-section-heading">
            <h2>{tab}</h2>
            <p>
              {tab === "General"
                ? "Configure the basics for your CRM workspace."
                : tab === "Users & roles"
                  ? "Control who can access your workspace and what they can do."
                  : tab === "Consent & suppression"
                    ? "Manage consent records and protect contact preferences."
                    : tab === "Security & privacy"
                      ? "Review privileged account safeguards and contact rights requests."
                      : "Connect the services that power your campaigns."}
            </p>
          </div>
          {tab === "General" && (
            <>
              <div className="settings-section-heading organization-profile-heading">
                <h3>Organization profile</h3>
                <p>Workspace details and the account currently managing this organization.</p>
              </div>
              <div className="organization-account-card">
                <div className="avatar user-avatar">
                  {account.name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("")}
                </div>
                <div className="organization-account-details">
                  <b>{account.name || account.email}</b>
                  <small>{account.email}</small>
                </div>
                <button className="btn secondary" onClick={() => setConfirmSignOut(true)}>
                  <LogOut size={15} /> Sign out
                </button>
              </div>
              <label className="form-label">
                Organization name
                <input
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                />
              </label>
              <label className="form-label">
                Default timezone
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                >
                  <option>Africa/Lagos</option>
                  <option>UTC</option>
                </select>
              </label>
              <label className="form-label">
                Default sender name
                <input
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                />
              </label>
            </>
          )}
          {tab === "Users & roles" && (
            <div className="team-access-page">
              <div className="superadmin-notice">
                <span>
                  <ShieldCheck size={18} />
                </span>
                <div>
                  <b>Superadmin controls</b>
                  <p>
                    Amara Okafor is the workspace superadmin. Superadmins have
                    full access and can add admins, assign roles, and customize
                    permissions.
                  </p>
                </div>
                <Badge tone="Subscribed">Superadmin</Badge>
              </div>
              <div className="team-access-heading">
                <div>
                  <h3>Workspace members</h3>
                  <p>
                    {users.length} people ? permissions are saved in this
                    browser preview
                  </p>
                </div>
                {isSuperadmin && (
                  <button
                    className="btn primary"
                    onClick={() => {
                      setInviteOpen((open) => !open);
                      setInviteError("");
                    }}
                  >
                    <Plus size={15} /> Add teammate
                  </button>
                )}
              </div>
              <div className="team-member-list">
                {users.map((user) => {
                  const isRoot = user.role === "Superadmin";
                  const isEditing = editingPermissions === user.email;
                  return (
                    <article className="team-member-card" key={user.email}>
                      <div className="team-member-row">
                        <div className="avatar lavender">
                          {user.name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")}
                        </div>
                        <div className="team-member-identity">
                          <b>{user.name}</b>
                          <small>{user.email}</small>
                        </div>
                        {isRoot ? (
                          <Badge tone="Dynamic">Superadmin</Badge>
                        ) : (
                          <label className="team-role-select">
                            <span className="sr-only">
                              Role for {user.name}
                            </span>
                            <select
                              disabled={!isSuperadmin}
                              value={user.role}
                              onChange={(event) =>
                                changeRole(
                                  user.email,
                                  event.target.value as TeamRole,
                                )
                              }
                            >
                              <option>Admin</option>
                              <option>Campaign Approver</option>
                              <option>Marketing Staff</option>
                              <option>Viewer</option>
                            </select>
                          </label>
                        )}
                        <span className="permission-count">
                          {user.permissions.length} permissions
                        </span>
                        {isSuperadmin && !isRoot && (
                          <button
                            className="btn secondary"
                            onClick={() =>
                              setEditingPermissions(isEditing ? "" : user.email)
                            }
                          >
                            {isEditing
                              ? "Close permissions"
                              : "Set permissions"}
                          </button>
                        )}
                      </div>
                      {isRoot && (
                        <p className="superadmin-lock-note">
                          <ShieldCheck size={13} /> Full workspace access is
                          protected and cannot be removed here.
                        </p>
                      )}
                      {isEditing && !isRoot && (
                        <div className="permission-editor">
                          <div className="permission-editor-heading">
                            <div>
                              <b>Permissions for {user.name}</b>
                              <small>
                                Choose the actions this teammate can perform.
                              </small>
                            </div>
                            <button
                              className="text-link"
                              onClick={() => resetPermissions(user.email)}
                            >
                              Reset to {user.role} defaults
                            </button>
                          </div>
                          <div className="permission-groups">
                            {Array.from(
                              new Set(
                                permissionCatalog.map(
                                  (permission) => permission.group,
                                ),
                              ),
                            ).map((group) => (
                              <section className="permission-group" key={group}>
                                <h4>{group}</h4>
                                {permissionCatalog
                                  .filter(
                                    (permission) => permission.group === group,
                                  )
                                  .map((permission) => (
                                    <label
                                      className="permission-option"
                                      key={permission.id}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={user.permissions.includes(
                                          permission.id,
                                        )}
                                        onChange={() =>
                                          togglePermission(
                                            user.email,
                                            permission.id,
                                          )
                                        }
                                      />
                                      <span>{permission.label}</span>
                                    </label>
                                  ))}
                              </section>
                            ))}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
              {inviteOpen && isSuperadmin && (
                <form
                  className="invite-form superadmin-invite"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const email = inviteEmail.trim().toLowerCase();
                    if (!/^\S+@\S+\.\S+$/.test(email)) {
                      setInviteError("Enter a valid work email.");
                      return;
                    }
                    if (
                      users.some((user) => user.email.toLowerCase() === email)
                    ) {
                      setInviteError(
                        "This person is already in the workspace.",
                      );
                      return;
                    }
                    const name = email
                      .split("@")[0]
                      .split(/[._-]/)
                      .map(
                        (part) => part.charAt(0).toUpperCase() + part.slice(1),
                      )
                      .join(" ");
                    setUsers((current) => [
                      ...current,
                      {
                        name,
                        email,
                        role: inviteRole,
                        permissions: [...rolePermissions[inviteRole]],
                      },
                    ]);
                    recordAudit(
                      "Added workspace member",
                      `${email} ? ${inviteRole}`,
                      "Team access updated",
                    );
                    setInviteEmail("");
                    setInviteRole("Marketing Staff");
                    setInviteOpen(false);
                    setInviteError("");
                  }}
                >
                  <div className="invite-form-intro">
                    <h3>Add a workspace member</h3>
                    <p>
                      Choose a role now. You can customize permissions after
                      adding the member.
                    </p>
                  </div>
                  <label className="form-label">
                    Work email
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(event) => {
                        setInviteEmail(event.target.value);
                        setInviteError("");
                      }}
                      placeholder="name@company.com"
                    />
                  </label>
                  <label className="form-label">
                    Role
                    <select
                      value={inviteRole}
                      onChange={(event) =>
                        setInviteRole(event.target.value as TeamRole)
                      }
                    >
                      <option>Admin</option>
                      <option>Campaign Approver</option>
                      <option>Marketing Staff</option>
                      <option>Viewer</option>
                    </select>
                  </label>
                  {inviteRole === "Admin" && (
                    <p className="admin-role-note">
                      <ShieldCheck size={14} /> Admin gets broad workspace
                      access by default. Review and adjust individual
                      permissions after adding.
                    </p>
                  )}
                  {inviteError && (
                    <p className="validation-message" role="alert">
                      {inviteError}
                    </p>
                  )}
                  <div className="invite-form-actions">
                    <button
                      className="btn secondary"
                      type="button"
                      onClick={() => setInviteOpen(false)}
                    >
                      Cancel
                    </button>
                    <button className="btn primary" type="submit">
                      <Plus size={14} /> Add member
                    </button>
                  </div>
                  <small>Preview only. No invitation email is sent.</small>
                </form>
              )}
              <p className="team-access-footnote">
                Role and permission changes are stored locally for this preview.
                A connected identity service must enforce them in production.
              </p>
            </div>
          )}
          {tab === "Consent & suppression" && (
            <>
              <div className="consent-info">
                <ShieldCheck size={18} />
                <div>
                  <b>Consent configuration preview</b>
                  <p>
                    A connected backend must suppress unsubscribed email
                    addresses and SMS opt-outs before every send.
                  </p>
                </div>
              </div>
              {[
                ["Email unsubscribe suppression", "Preview only"],
                ["SMS opt-out suppression", "Preview only"],
                ["Consent capture on import", "Required by design"],
                ["Consent history retention", "Configure policy"],
              ].map((row) => (
                <div className="preference-row" key={row[0]}>
                  <div>
                    <b>{row[0]}</b>
                    <small>
                      Preview setting · backend enforcement required
                    </small>
                  </div>
                  <Badge tone="neutral">{row[1]}</Badge>
                </div>
              ))}
            </>
          )}
          {tab === "Security & privacy" && (
            <div className="security-privacy-settings">
              <div className="consent-info">
                <ShieldCheck size={18} />
                <div>
                  <b>Privileged account protection</b>
                  <p>
                    Require two-step verification for superadmins and workspace
                    admins. Identity provider enforcement is needed outside this
                    preview.
                  </p>
                </div>
              </div>
              <label className="preference-row security-toggle">
                <span>
                  <b>Require two-factor authentication</b>
                  <small>
                    Required for Superadmin and Admin roles · identity provider
                    enforcement required
                  </small>
                </span>
                <input
                  type="checkbox"
                  checked={twoFactorRequired}
                  disabled
                  aria-label="Two-factor authentication is required for privileged accounts"
                />
              </label>
              <div className="privacy-request-form">
                <div>
                  <h3>Data rights requests</h3>
                  <p>
                    Record access, correction, and deletion requests for
                    follow-up.
                  </p>
                </div>
                <div className="field-pair">
                  <label className="form-label">
                    Request type
                    <select
                      value={privacyRequestType}
                      onChange={(event) =>
                        setPrivacyRequestType(event.target.value)
                      }
                    >
                      <option>Access</option>
                      <option>Correction</option>
                      <option>Deletion</option>
                    </select>
                  </label>
                  <label className="form-label">
                    Contact email
                    <input
                      type="email"
                      value={privacyRequestEmail}
                      onChange={(event) =>
                        setPrivacyRequestEmail(event.target.value)
                      }
                      placeholder="name@example.com"
                    />
                  </label>
                </div>
                <button
                  className="btn primary"
                  onClick={() => {
                    const email = privacyRequestEmail.trim().toLowerCase();
                    if (!/^\S+@\S+\.\S+$/.test(email)) {
                      notify("Enter a valid contact email to log the request");
                      return;
                    }
                    setPrivacyRequests((current) => [
                      {
                        type: privacyRequestType,
                        email,
                        date: new Date().toLocaleString(),
                        status: "Received",
                      },
                      ...current,
                    ]);
                    recordAudit(
                      "Logged data rights request",
                      `${privacyRequestType} · ${email}`,
                      "Privacy request",
                    );
                    setPrivacyRequestEmail("");
                    notify("Privacy request logged in this preview");
                  }}
                >
                  <Plus size={15} /> Log request
                </button>
              </div>
              <div className="privacy-request-list">
                <h3>Request register</h3>
                {privacyRequests.length ? (
                  privacyRequests.map((request, index) => (
                    <div
                      className="preference-row"
                      key={`${request.email}-${index}`}
                    >
                      <span>
                        <b>{request.type} request</b>
                        <small>
                          {request.email} · {request.date}
                        </small>
                      </span>
                      <Badge tone="neutral">{request.status}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="empty-subtext">
                    No data rights requests have been recorded in this session.
                  </p>
                )}
              </div>
              <p className="settings-disclaimer">
                Requests are stored in this browser preview. Production needs
                identity verification, secure case handling, and retention
                controls.
              </p>
            </div>
          )}
          {tab === "Integrations" && (
            <div className="integration-grid">
              {[
                ["Brevo", "Email delivery", "Connect provider", "mail"],
                ["Amazon SES", "Email delivery", "Connect provider", "mail"],
                ["Termii", "SMS delivery", "Connect provider", "sms"],
                ["Africa’s Talking", "SMS delivery", "Connect provider", "sms"],
                [
                  "WhatsApp Business",
                  "WhatsApp messaging",
                  "View setup",
                  "whatsapp",
                ],
              ].map((x) => (
                <div className="integration-card" key={x[0]}>
                  <div
                    className={`channel-icon ${x[3] === "mail" ? "mail-icon" : x[3] === "whatsapp" ? "whatsapp-icon" : "sms-icon"}`}
                  >
                    {x[3] === "mail" ? (
                      <Mail size={17} />
                    ) : x[3] === "whatsapp" ? (
                      <MessageCircle size={17} />
                    ) : (
                      <MessageSquareText size={17} />
                    )}
                  </div>
                  <div>
                    <b>{x[0]}</b>
                    <small>{x[1]}</small>
                  </div>
                  <button
                    className="btn secondary"
                    onClick={() =>
                      setOpenProvider((current) =>
                        current === x[0] ? "" : x[0],
                      )
                    }
                  >
                    {openProvider === x[0] ? "Hide setup" : "View setup"}
                  </button>
                </div>
              ))}
            </div>
          )}
          {tab === "Integrations" && openProvider && (
            <div className="provider-setup">
              <div>
                <Badge tone="neutral">Not connected</Badge>
                <h3>{openProvider} setup</h3>
                <p>
                  Connect credentials and verify a sender before enabling
                  delivery. This preview does not transmit credentials or
                  contact the provider.
                </p>
              </div>
              <ul>
                {openProvider === "WhatsApp Business" ? (
                  <>
                    <li>Meta business and WhatsApp Business Account IDs</li>
                    <li>Verified WhatsApp sender and API credentials</li>
                    <li>Approved message templates and webhooks</li>
                  </>
                ) : (
                  <>
                    <li>Provider API credentials</li>
                    <li>Verified sender or phone number</li>
                    <li>Delivery and bounce callback configuration</li>
                  </>
                )}
              </ul>
            </div>
          )}
          <div className="settings-save">
            <small>Changes are applied to this preview session.</small>
            <button
              className="btn primary"
              onClick={() => {
                recordAudit(
                  "Saved settings preview",
                  `${tab} settings`,
                  "Settings updated",
                );
                notify("Settings saved in this preview session");
              }}
            >
              Save settings
            </button>
          </div>
        </section>
      </div>
      {confirmSignOut && (
        <div className="category-confirm" role="alertdialog" aria-modal="true" aria-labelledby="signout-title">
          <div className="category-confirm-card">
            <div className="danger-icon"><LogOut size={18} /></div>
            <h2 id="signout-title">Sign out of Cephas CRM?</h2>
            <p>You’ll need to sign in again to access the {account.name || "organization"} workspace.</p>
            <div className="category-confirm-actions">
              <button className="btn secondary" disabled={signingOut} onClick={() => setConfirmSignOut(false)}>Cancel</button>
              <button
                className="btn danger"
                disabled={signingOut}
                onClick={async () => {
                  setSigningOut(true);
                  try {
                    await onSignOut();
                  } finally {
                    setSigningOut(false);
                    setConfirmSignOut(false);
                  }
                }}
              >
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
function HelpCentreLegacy({ onBack }: { onBack: () => void }) {
  return (
    <>
      <PageHeading
        eyebrow="CEPHAS PEOPLE SUPPORT"
        title="Help centre"
        desc="Quick guidance for working with contacts, audiences, and campaigns."
        action={
          <button className="btn secondary" onClick={onBack}>
            <ChevronLeft size={16} /> Back to dashboard
          </button>
        }
      />
      <section className="panel help-centre-grid">
        {[
          [
            "Manage contacts",
            "Add contacts individually or import a CSV. Review each contact’s consent status before sending campaigns.",
          ],
          [
            "Build an audience",
            "Create a dynamic audience from filter rules or a static group from selected contacts.",
          ],
          [
            "Use a template",
            "Open Templates, choose Use template, then review the subject, message, and audience before saving a campaign draft.",
          ],
          [
            "Review campaign drafts",
            "Campaign drafts stay in this UI preview. A connected delivery provider is needed to schedule or send messages.",
          ],
        ].map(([title, description]) => (
          <article className="help-topic" key={title}>
            <div className="audience-rule-icon">
              <CircleHelp size={16} />
            </div>
            <div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
function HelpCentre({
  onBack,
  setPage,
}: {
  onBack: () => void;
  setPage: (page: Page) => void;
}) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState("");
  const guides = [
    {
      title: "Manage contacts",
      group: "CONTACTS",
      description:
        "Add people, organize records, and review consent before outreach.",
      steps: [
        "Open Contacts and add a person, or import a CSV or Excel workbook.",
        "Review imported fields, duplicate warnings, and invalid rows before continuing.",
        "Edit the profile to maintain tags, interests, phone, organisation, and channel consent.",
      ],
      icon: <ContactRound size={18} />,
    },
    {
      title: "Build an audience",
      group: "AUDIENCES",
      description:
        "Create a saved group from selected contacts or define a dynamic segment.",
      steps: [
        "Select contacts and choose Create static audience, or open Audiences.",
        "Name the group; dynamic segments can filter by category, tag, location, interest, and consent status.",
        "Review matched contacts. Dynamic preview counts use email consent; each channel’s opt-in must be checked before delivery.",
      ],
      icon: <Users size={18} />,
    },
    {
      title: "Use a template",
      group: "TEMPLATES",
      description: "Start a campaign with reusable email or SMS content.",
      steps: [
        "Open Templates and choose a template for the right channel.",
        "Review and personalize its content, subject line, and audience.",
        "Save the campaign as a draft for review.",
      ],
      icon: <FileText size={18} />,
    },
    {
      title: "Review campaign drafts",
      group: "CAMPAIGNS",
      description:
        "Prepare messages and review campaign details before they are sent.",
      steps: [
        "Open Email campaigns or Bulk SMS and create a campaign.",
        "Select one or more audiences, remove duplicates, and exclude specific contacts if needed.",
        "Preview the content, prepare a local test preview, or save a draft/schedule record.",
        "Actual email, SMS, and WhatsApp delivery needs an approved provider and background scheduler.",
      ],
      icon: <Send size={18} />,
    },
    {
      title: "Review contact duplicates",
      group: "DATA QUALITY",
      description:
        "Resolve likely email or phone matches while protecting consent preferences.",
      steps: [
        "Add or edit the contact, or import a workbook with duplicate rows.",
        "For manual matches, compare records and choose Merge safely or Keep both when emails differ.",
        "Merge retains alternate email addresses and the stricter consent status; imports report duplicate rows skipped.",
      ],
      icon: <ContactRound size={18} />,
    },
    {
      title: "Manage privacy and access",
      group: "SECURITY",
      description:
        "Review opt-in preferences, privileged account protection, and rights requests.",
      steps: [
        "Open Settings → Security & privacy to log access, correction, or deletion requests.",
        "Review email consent and SMS opt-in separately on a contact profile.",
        "Two-factor authentication is required for privileged roles; a connected identity service must enforce it.",
      ],
      icon: <ShieldCheck size={18} />,
    },
    {
      title: "Read campaign reports",
      group: "REPORTS",
      description:
        "Review preview metrics and distinguish sample data from provider results.",
      steps: [
        "Open Reports to review sample delivery, engagement, and campaign comparison indicators.",
        "Use exports for a local snapshot of the report data.",
        "Live delivery, bounce, click, opt-out, and cost data appear after provider events are connected.",
      ],
      icon: <TrendingUp size={18} />,
    },
  ];
  const visibleGuides = guides.filter((guide) =>
    `${guide.title} ${guide.group} ${guide.description} ${guide.steps.join(" ")}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  const shortcuts: {
    label: string;
    description: string;
    page: Page;
    icon: React.ReactNode;
  }[] = [
    {
      label: "Contacts",
      description: "Add or find a person",
      page: "Contacts",
      icon: <ContactRound size={18} />,
    },
    {
      label: "Audiences",
      description: "Explore your groups",
      page: "Audiences",
      icon: <Users size={18} />,
    },
    {
      label: "Templates",
      description: "Browse reusable content",
      page: "Templates",
      icon: <FileText size={18} />,
    },
    {
      label: "Campaigns",
      description: "Review email and SMS",
      page: "Email campaigns",
      icon: <Send size={18} />,
    },
  ];
  return (
    <div className="help-centre-page">
      <PageHeading
        eyebrow="CEPHAS PEOPLE SUPPORT"
        title="Help centre"
        desc="Find a quick answer or jump straight into a workspace task."
        action={
          <button className="btn secondary" onClick={onBack}>
            <ChevronLeft size={16} /> Back to dashboard
          </button>
        }
      />
      <section className="help-search-hero">
        <div className="help-hero-copy">
          <span>
            <LifeBuoy size={15} /> CEPHAS SUPPORT
          </span>
          <h2>How can we help?</h2>
          <p>Search setup tips and step-by-step guides.</p>
        </div>
        <label className="help-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search contacts, audiences, templates…"
            aria-label="Search help guides"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear help search"
            >
              <X size={16} />
            </button>
          )}
        </label>
        <div className="help-hero-decoration">
          <span>
            <CircleHelp size={25} />
          </span>
          <i />
          <i />
          <i />
        </div>
      </section>
      <section className="help-shortcuts-section">
        <div className="help-section-heading">
          <div>
            <p className="eyebrow">QUICK LINKS</p>
            <h2>Jump into your workspace</h2>
          </div>
          <span>Choose a task to get started</span>
        </div>
        <div className="help-shortcuts">
          {shortcuts.map((shortcut) => (
            <button
              className="help-shortcut"
              key={shortcut.label}
              onClick={() => setPage(shortcut.page)}
            >
              <span className="help-shortcut-icon">{shortcut.icon}</span>
              <span>
                <b>{shortcut.label}</b>
                <small>{shortcut.description}</small>
              </span>
              <ArrowUpRight size={15} />
            </button>
          ))}
        </div>
      </section>
      <section className="help-guides-section">
        <div className="help-section-heading">
          <div>
            <p className="eyebrow">GETTING STARTED</p>
            <h2>Popular guides</h2>
          </div>
          <span>
            {visibleGuides.length}{" "}
            {visibleGuides.length === 1 ? "guide" : "guides"}
          </span>
        </div>
        {visibleGuides.length ? (
          <div className="help-guides-grid">
            {visibleGuides.map((guide) => {
              const isOpen = expanded === guide.title;
              return (
                <article
                  className={`help-guide ${isOpen ? "expanded" : ""}`}
                  key={guide.title}
                >
                  <div className="help-guide-top">
                    <span className="help-guide-icon">{guide.icon}</span>
                    <span className="help-guide-group">{guide.group}</span>
                  </div>
                  <h3>{guide.title}</h3>
                  <p>{guide.description}</p>
                  {isOpen && (
                    <ol>
                      {guide.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  )}
                  <button
                    className="help-guide-toggle"
                    aria-expanded={isOpen}
                    onClick={() => setExpanded(isOpen ? "" : guide.title)}
                  >
                    {isOpen ? "Close guide" : "Read step-by-step"}
                    <ChevronRight size={15} />
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="help-no-results">
            <Search size={18} />
            <b>No guides found</b>
            <span>Try a different search, like “template” or “contacts”.</span>
          </div>
        )}
      </section>
    </div>
  );
}
function NotificationsPage({ onBack }: { onBack: () => void }) {
  return (
    <>
      <PageHeading
        eyebrow="WORKSPACE UPDATES"
        title="Notifications"
        desc="Approvals and important workspace activity will appear here."
        action={
          <button className="btn secondary" onClick={onBack}>
            <ChevronLeft size={16} /> Back to dashboard
          </button>
        }
      />
      <div className="panel notification-empty">
        <div>
          <Bell size={20} />
        </div>
        <h2>You’re all caught up</h2>
        <p>There are no new notifications in this preview.</p>
      </div>
    </>
  );
}
function ComingSoon() {
  return (
    <>
      <PageHeading
        eyebrow="ON THE ROADMAP"
        title="Lead management"
        desc="Keep track of prospects and opportunities as your CRM grows."
      />
      <section className="panel coming-card">
        <div className="coming-icon">
          <Layers3 size={24} />
        </div>
        <Badge tone="Dynamic">Coming in a later release</Badge>
        <h2>Turn new interest into lasting relationships.</h2>
        <p>
          Lead stages, follow-up reminders, task assignment and a configurable
          sales pipeline are planned for a future release.
        </p>
        <div className="coming-roadmap">
          <span>
            <i className="roadmap-done" />
            Contact management
          </span>
          <span>
            <i className="roadmap-done" />
            Email & SMS campaigns
          </span>
          <span>
            <i className="roadmap-current" />
            Lead management
          </span>
          <span>
            <i />
            Automation & integrations
          </span>
        </div>
      </section>
    </>
  );
}
function ModalDialog({
  kind,
  categories,
  close,
  save,
  saveContact,
  initialContact,
  campaignNames,
  saveDraft,
  saveAudience,
  saveTemplate,
  importContacts,
  recordAudit,
  notify,
  initialAudience,
  initialAudienceRecord,
  audienceOptions,
  initialTemplate,
  initialMembers,
  contacts,
}: {
  kind: string;
  categories: string[];
  close: () => void;
  save: (contact: Contact) => void;
  saveContact: (contact: Contact) => void;
  initialContact: Contact | null;
  campaignNames: string[];
  saveDraft: (
    channel: "Email" | "SMS" | "WhatsApp",
    name: string,
    audience: string,
    objective: string,
    message: string,
    status?: string,
    scheduledAt?: string,
    emailBlocks?: EmailBlock[],
    attachments?: string[],
    targeting?: {
      includedAudiences: string[];
      excludedAudiences: string[];
      excludedContacts: string[];
    },
  ) => void;
  saveAudience: (
    name: string,
    type: "Dynamic segment" | "Static group",
    rules: FilterRule[],
    members: Contact[],
    audienceId?: string,
    description?: string,
  ) => void;
  initialAudienceRecord: AudienceRecord | null;
  initialMembers: Contact[];
  contacts: Contact[];
  saveTemplate: (template: TemplateDraft) => void;
  importContacts: (file: File) => void;
  recordAudit: (activity: string, details: string, eventType: string) => void;
  notify: (s: string) => void;
  initialAudience: string;
  audienceOptions: { name: string; detail: string }[];
  initialTemplate: TemplateDraft | null;
}) {
  const nameParts = initialContact?.name.split(/\s+/) ?? [];
  const [firstName, setFirstName] = useState(nameParts[0] ?? ""),
    [lastName, setLastName] = useState(nameParts.slice(1).join(" ")),
    [email, setEmail] = useState(initialContact?.email ?? ""),
    [phone, setPhone] = useState(initialContact?.phone ?? ""),
    [organization, setOrganization] = useState(
      initialContact?.organization ?? "",
    ),
    [category, setCategory] = useState(initialContact?.category ?? ""),
    [location, setLocation] = useState(initialContact?.location ?? ""),
    [interestsText, setInterestsText] = useState(
      initialContact?.interests?.join(", ") ?? "",
    ),
    [tagsText, setTagsText] = useState(initialContact?.tags?.join(", ") ?? ""),
    [contactStatus, setContactStatus] = useState<Contact["status"]>(
      initialContact?.status ?? "Pending",
    ),
    [smsStatus, setSmsStatus] = useState<Contact["status"]>(
      initialContact?.smsStatus ?? "Pending",
    ),
    [consent, setConsent] = useState(initialContact?.status === "Subscribed"),
    [file, setFile] = useState<File | null>(null),
    [message, setMessage] = useState(""),
    [emailBlocks, setEmailBlocks] = useState<EmailBlock[]>([
      ...(initialTemplate?.emailBlocks ?? [
        {
          id: "email-text-1",
          type: "text" as const,
          content: initialTemplate?.body ?? "",
        },
      ]),
    ]),
    [draggedBlockId, setDraggedBlockId] = useState<string | null>(null),
    [campaignName, setCampaignName] = useState(
      initialAudienceRecord?.name ?? (initialTemplate ? `${initialTemplate.name} campaign` : ""),
    ),
    [audienceDescription, setAudienceDescription] = useState(initialAudienceRecord?.description ?? ""),
    [subject, setSubject] = useState(initialTemplate?.subject ?? ""),
    [audiences, setAudiences] = useState<string[]>(
      initialAudience
        .split(", ")
        .map((name) => name.trim())
        .filter(Boolean),
    ),
    [audiencePickerOpen, setAudiencePickerOpen] = useState(false),
    [audienceSearch, setAudienceSearch] = useState(""),
    [scheduleAt, setScheduleAt] = useState(""),
    [previewOpen, setPreviewOpen] = useState(false),
    [testEmail, setTestEmail] = useState(""),
    [excludedEmails, setExcludedEmails] = useState<string[]>(
      initialTemplate?.excludedContacts ?? [],
    ),
    [excludedAudiences, setExcludedAudiences] = useState<string[]>(
      initialTemplate?.excludedAudiences ?? [],
    ),
    [attachmentNames, setAttachmentNames] = useState<string[]>(
      initialTemplate?.attachments ?? [],
    ),
    [senderId, setSenderId] = useState(""),
    [objective, setObjective] = useState(initialTemplate?.objective ?? ""),
    [segmentType, setSegmentType] = useState<
      "Dynamic segment" | "Static group"
    >(initialAudienceRecord?.type ?? (initialMembers.length > 0 ? "Static group" : "Dynamic segment")),
    [templateChannel, setTemplateChannel] = useState<
      "Email" | "SMS" | "WhatsApp"
    >(initialTemplate?.channel ?? "Email"),
    [rules, setRules] = useState<FilterRule[]>(initialAudienceRecord?.rules.length ? initialAudienceRecord.rules : [
      { field: "Category", operator: "is", value: "" },
    ]),
    [validation, setValidation] = useState("");
  useEffect(() => {
    if (!initialAudienceRecord) return;
    setCampaignName(initialAudienceRecord.name);
    setAudienceDescription(initialAudienceRecord.description);
    setSegmentType(initialAudienceRecord.type);
    setRules(initialAudienceRecord.rules.length ? initialAudienceRecord.rules : [{ field: "Category", operator: "is", value: "" }]);
    setValidation("");
  }, [initialAudienceRecord]);
  useEffect(() => {
    if (initialTemplate) {
      setCampaignName(`${initialTemplate.name} campaign`);
      setTemplateChannel(initialTemplate.channel);
      setSubject(initialTemplate.subject);
      setObjective(initialTemplate.objective ?? "");
      setExcludedAudiences(initialTemplate.excludedAudiences ?? []);
      setExcludedEmails(initialTemplate.excludedContacts ?? []);
      setMessage(initialTemplate.body);
      setEmailBlocks(
        initialTemplate.emailBlocks ?? [
          {
            id: `email-text-${Date.now()}`,
            type: "text",
            content: initialTemplate.body,
          },
        ],
      );
      setAttachmentNames(initialTemplate.attachments ?? []);
    }
  }, [initialTemplate]);
  const initialAudienceNames = initialAudience
    .split(", ")
    .map((name) => name.trim())
    .filter(Boolean);
  const audienceChoices = Array.from(
    new Map(
      [
        ...audienceOptions,
        ...initialAudienceNames
          .filter((name) => !audienceOptions.some((item) => item.name === name))
          .map((name) => ({ name, detail: "Selected audience" })),
      ].map((item) => [item.name, item]),
    ).values(),
  );
  const filteredAudienceChoices = audienceChoices.filter((item) =>
    `${item.name} ${item.detail}`
      .toLowerCase()
      .includes(audienceSearch.toLowerCase()),
  );
  const smsEstimate = getSmsEstimate(message);
  const title =
    kind === "add"
      ? "Add a contact"
      : kind === "import"
        ? "Import contacts"
        : kind === "edit-contact"
          ? "Edit contact"
          : kind === "segment" || kind === "edit-audience"
            ? kind === "edit-audience" ? "Edit audience" : "Create an audience"
            : kind === "template"
              ? "Create a template"
              : kind === "sms"
                ? "Create an SMS campaign"
                : kind === "whatsapp"
                  ? "Create a WhatsApp campaign"
                  : "Create an email campaign";
  const pickFile = (candidate?: File) => {
    if (!candidate) return;
    if (!/\.(csv|xlsx|xls)$/i.test(candidate.name)) {
      setValidation("Choose a CSV or Excel workbook (.xlsx or .xls).");
      return;
    }
    if (candidate.size > 10 * 1024 * 1024) {
      setValidation("This file is over the 10 MB limit.");
      return;
    }
    setFile(candidate);
    setValidation("");
  };
  const commitEmailBlocks = (next: EmailBlock[]) => {
    setEmailBlocks(next);
    setMessage(serializeEmailBlocks(next));
  };
  const addEmailBlock = (type: EmailBlock["type"]) => {
    const content =
      type === "link" ? "Read more" : type === "button" ? "Get started" : "";
    commitEmailBlocks([
      ...emailBlocks,
      { id: `email-${type}-${crypto.randomUUID()}`, type, content },
    ]);
  };
  const updateEmailBlock = (id: string, updates: Partial<EmailBlock>) =>
    commitEmailBlocks(
      emailBlocks.map((block) =>
        block.id === id ? { ...block, ...updates } : block,
      ),
    );
  const removeEmailBlock = (id: string) =>
    commitEmailBlocks(emailBlocks.filter((block) => block.id !== id));
  const shiftEmailBlock = (id: string, offset: -1 | 1) => {
    const currentIndex = emailBlocks.findIndex((block) => block.id === id);
    const nextIndex = currentIndex + offset;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= emailBlocks.length)
      return;
    const next = [...emailBlocks];
    [next[currentIndex], next[nextIndex]] = [
      next[nextIndex],
      next[currentIndex],
    ];
    commitEmailBlocks(next);
  };
  const moveEmailBlock = (targetId: string) => {
    if (!draggedBlockId || draggedBlockId === targetId) return;
    const next = [...emailBlocks];
    const from = next.findIndex((block) => block.id === draggedBlockId);
    const to = next.findIndex((block) => block.id === targetId);
    if (from < 0 || to < 0) return;
    const [block] = next.splice(from, 1);
    next.splice(to, 0, block);
    commitEmailBlocks(next);
    setDraggedBlockId(null);
  };
  const submit = () => {
    if (kind === "add" || kind === "edit-contact") {
      const name = `${firstName.trim()} ${lastName.trim()}`.trim();
      if (
        !firstName.trim() ||
        !email.trim() ||
        !/^\S+@\S+\.\S+$/.test(email.trim())
      ) {
        setValidation("Enter a first name and a valid email address.");
        return;
      }
      const phoneDigits = phone.replace(/\D/g, "");
      if (phone.trim() && (phoneDigits.length < 7 || phoneDigits.length > 15)) {
        setValidation("Enter a valid phone number with 7 to 15 digits.");
        return;
      }
      saveContact({
        name,
        email: email.trim(),
        alternateEmails: initialContact?.alternateEmails ?? [],
        phone: phone.trim() || undefined,
        organization: organization.trim() || undefined,
        category:
          category ||
          (categories.includes("Prospect")
            ? "Prospect"
            : (categories[0] ?? "Uncategorized")),
        location: location.trim() || "Not provided",
        interests: interestsText
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        tags: tagsText
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        status:
          kind === "edit-contact"
            ? contactStatus
            : consent
              ? "Subscribed"
              : "Pending",
        smsStatus,
        initials: name
          .split(/\s+/)
          .slice(0, 2)
          .map((v) => v[0]?.toUpperCase() || "")
          .join(""),
        color: "blue",
        date: "Nov 13, 2026",
      });
      return;
    }
    if (kind === "import") {
      if (file) {
        importContacts(file);
        return;
      }
      setValidation("Select a CSV or Excel file to continue.");
      return;
    }
    if (kind === "email" || kind === "sms" || kind === "whatsapp") {
      if (!campaignName.trim()) {
        setValidation("Enter a campaign name before saving this draft.");
        return;
      }
      if (
        campaignNames.some(
          (name) => name.toLowerCase() === campaignName.trim().toLowerCase(),
        )
      ) {
        setValidation(
          "A campaign with this name already exists. Choose a unique name.",
        );
        return;
      }
      if (kind === "email" && !subject.trim()) {
        setValidation("Enter an email subject line before saving this draft.");
        return;
      }
      const hasContent =
        kind === "email"
          ? emailBlocks.some(
              (block) => block.type !== "divider" && block.content.trim(),
            )
          : Boolean(message.trim());
      if (!hasContent) {
        setValidation("Add message content before saving this draft.");
        return;
      }
      if (kind === "sms" && senderId && !/^[A-Za-z0-9]{1,11}$/.test(senderId)) {
        setValidation("Sender ID must use up to 11 letters or numbers.");
        return;
      }
      if (
        kind === "email" &&
        emailBlocks.some(
          (block) =>
            (block.type === "link" || block.type === "button") &&
            !/^https?:\/\//i.test(block.url ?? ""),
        )
      ) {
        setValidation(
          "Add a valid https:// link to each link or button block.",
        );
        return;
      }
      if (scheduleAt && new Date(scheduleAt).getTime() <= Date.now()) {
        setValidation(
          "Choose a future date and time to schedule this campaign.",
        );
        return;
      }
      if (scheduleAt && !audiences.length) {
        setValidation("Choose at least one audience before scheduling.");
        return;
      }
      saveDraft(
        kind === "sms" ? "SMS" : kind === "whatsapp" ? "WhatsApp" : "Email",
        campaignName.trim(),
        audiences.length
          ? `${audiences.join(", ")}${excludedAudiences.length ? ` · excluding groups: ${excludedAudiences.join(", ")}` : ""}${excludedEmails.length ? ` · excluding ${excludedEmails.length} contact${excludedEmails.length === 1 ? "" : "s"}` : ""}`
          : "Not selected",
        objective,
        `${kind === "email" ? `Subject: ${subject.trim()}\n\n` : ""}${message}${attachmentNames.length ? `\n\nAttachments: ${attachmentNames.join(", ")}` : ""}${kind === "sms" && senderId ? `\nSender ID: ${senderId}` : ""}`,
        scheduleAt ? "Scheduled" : "Draft",
        scheduleAt,
        kind === "email" ? emailBlocks : undefined,
        kind === "email" ? attachmentNames : undefined,
        {
          includedAudiences: audiences,
          excludedAudiences,
          excludedContacts: excludedEmails,
        },
      );
      return;
    }
    if (kind === "segment" || kind === "edit-audience") {
      if (!campaignName.trim()) {
        setValidation("Enter an audience name.");
        return;
      }
      if (
        audienceChoices.some(
          (item) =>
            item.name.toLowerCase() === campaignName.trim().toLowerCase() &&
            item.name.toLowerCase() !== initialAudienceRecord?.name.toLowerCase(),
        )
      ) {
        setValidation(
          "An audience with this name already exists. Choose a unique name.",
        );
        return;
      }
      if (
        segmentType === "Dynamic segment" &&
        rules.some((rule) => !rule.value)
      ) {
        setValidation("Choose a value for each dynamic segment condition.");
        return;
      }
      saveAudience(
        campaignName.trim(),
        segmentType,
        segmentType === "Dynamic segment" ? rules : [],
        initialMembers,
        initialAudienceRecord?.id,
        audienceDescription,
      );
      return;
    }
    if (kind === "template") {
      if (!campaignName.trim()) {
        setValidation("Enter a template name.");
        return;
      }
      if (templateChannel === "Email" && !subject.trim()) {
        setValidation("Add a subject line to your email template.");
        return;
      }
      if (!message.trim()) {
        setValidation("Add message content to your template.");
        return;
      }
      saveTemplate({
        name: campaignName.trim(),
        channel: templateChannel,
        subject: templateChannel === "Email" ? subject.trim() : "",
        body: message.trim(),
        emailBlocks: templateChannel === "Email" ? emailBlocks : undefined,
        attachments: templateChannel === "Email" ? attachmentNames : undefined,
      });
      return;
    }
    close();
    notify("Template setup preview closed; this template is not stored");
  };
  return (
    <div className="modal-backdrop" onMouseDown={close}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <p className="eyebrow">
              {kind === "add"
                ? "CONTACTS"
                : kind === "segment" || kind === "edit-audience"
                  ? "AUDIENCES"
                  : kind === "edit-contact"
                    ? "Edit a contact record"
                    : kind === "import"
                      ? "CONTACT IMPORT"
                      : kind === "template"
                        ? "TEMPLATE LIBRARY"
                        : "CAMPAIGN BUILDER"}
            </p>
            <h2 id="modal-title">{title}</h2>
          </div>
          <button
            className="icon-btn"
            aria-label="Close dialog"
            onClick={close}
          >
            <X size={18} />
          </button>
        </div>
        {kind === "add" || kind === "edit-contact" ? (
          <div className="modal-fields">
            <div className="field-pair">
              <label className="form-label">
                First name
                <input
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Amara"
                />
              </label>
              <label className="form-label">
                Last name
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Okafor"
                />
              </label>
            </div>
            <label className="form-label">
              Email address
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </label>
            <div className="field-pair">
              <label className="form-label">
                Phone number
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 800 000 0000"
                />
              </label>
              <label className="form-label">
                Organisation
                <input
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Company or institution"
                />
              </label>
            </div>
            <div className="field-pair">
              <label className="form-label">
                Category
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Choose category</option>
                  {categories.map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
              </label>
              <label className="form-label">
                Location
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, Country"
                />
              </label>
            </div>
            <label className="form-label">
              Interests
              <input
                value={interestsText}
                onChange={(e) => setInterestsText(e.target.value)}
                placeholder="Training, events, cybersecurity"
              />
            </label>
            <label className="form-label">
              Tags
              <input
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="Add tags, separated by commas"
              />
            </label>
            {kind === "edit-contact" ? (
              <div className="field-pair">
                <label className="form-label">
                  Email consent status
                  <select
                    value={contactStatus}
                    onChange={(e) =>
                      setContactStatus(e.target.value as Contact["status"])
                    }
                  >
                    <option>Pending</option>
                    <option>Subscribed</option>
                    <option>Unsubscribed</option>
                  </select>
                </label>
                <label className="form-label">
                  SMS opt-in status
                  <select
                    value={smsStatus}
                    onChange={(e) =>
                      setSmsStatus(e.target.value as Contact["status"])
                    }
                  >
                    <option>Pending</option>
                    <option>Subscribed</option>
                    <option>Unsubscribed</option>
                  </select>
                </label>
              </div>
            ) : (
              <>
                <label className="consent-check">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />{" "}
                  Contact has consented to email marketing
                </label>
                <label className="form-label">
                  SMS opt-in status
                  <select
                    value={smsStatus}
                    onChange={(e) =>
                      setSmsStatus(e.target.value as Contact["status"])
                    }
                  >
                    <option>Pending</option>
                    <option>Subscribed</option>
                    <option>Unsubscribed</option>
                  </select>
                </label>
              </>
            )}
            <p className="modal-note">
              <ShieldCheck size={15} />{" "}
              {kind === "edit-contact"
                ? "Unsubscribed contacts are suppressed from campaign targeting. Keep a clear record of each consent change."
                : "Email status stays pending without permission. Set SMS opt-in separately; imported lists do not grant consent."}
            </p>
          </div>
        ) : kind === "import" ? (
          <div className="modal-fields">
            <label
              className="dropzone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                pickFile(e.dataTransfer.files[0]);
              }}
            >
              <input
                className="file-input"
                type="file"
                accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
              <span className="drop-icon">
                <ArrowDownToLine size={23} />
              </span>
              <b>{file ? file.name : "Choose a CSV or Excel file"}</b>
              <p>Drop a file here or click to browse · Up to 10 MB</p>
            </label>
            <div className="import-steps">
              <span className="step-current">
                1 <b>Upload file</b>
              </span>
              <span>
                2 <b>Validate records</b>
              </span>
              <span>
                3 <b>Import contacts</b>
              </span>
            </div>
            <p className="modal-note">
              <ShieldCheck size={15} /> Email is required; invalid email or
              phone numbers and duplicate emails or phones are skipped. Both
              consent columns default to Pending unless their own consent status
              is explicitly supplied.
            </p>
          </div>
        ) : (
          <div className="modal-fields">
            <label className="form-label">
              {kind === "segment" || kind === "edit-audience"
                ? "Audience name"
                : kind === "template"
                  ? "Template name"
                  : "Campaign name"}
              <input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder={
                  kind === "segment" || kind === "edit-audience"
                    ? "e.g. Lagos alumni"
                    : kind === "template"
                      ? "e.g. Course launch"
                      : "Give it a clear name"
                }
              />
            </label>
            {(kind === "segment" || kind === "edit-audience") && <label className="form-label">
              Description
              <textarea rows={2} maxLength={500} value={audienceDescription} onChange={(event) => setAudienceDescription(event.target.value)} placeholder="Describe who belongs in this audience." />
              <small className="count-hint">{audienceDescription.length}/500</small>
            </label>}
            {kind === "template" && (
              <>
                <label className="form-label">
                  Template channel
                  <select
                    value={templateChannel}
                    onChange={(e) =>
                      setTemplateChannel(
                        e.target.value as typeof templateChannel,
                      )
                    }
                  >
                    <option>Email</option>
                    <option>SMS</option>
                    <option>WhatsApp</option>
                  </select>
                </label>
                {templateChannel === "Email" && (
                  <label className="form-label">
                    Subject line
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Write a clear subject line"
                    />
                  </label>
                )}
                <label className="form-label">
                  {templateChannel === "SMS"
                    ? "SMS message"
                    : templateChannel === "WhatsApp"
                      ? "WhatsApp message"
                      : "Email content"}
                  <textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write reusable content with {{first_name}} for personalisation."
                  />
                </label>
                <small className="count-hint">
                  Merge fields such as {"{{first_name}}"} stay in the saved
                  template.
                </small>
                {templateChannel === "WhatsApp" && (
                  <p className="modal-note">
                    <MessageCircle size={15} /> WhatsApp business templates need
                    provider approval before they can be sent.
                  </p>
                )}
              </>
            )}
            {kind === "segment" || kind === "edit-audience" ? (
              <>
                <label className="form-label">
                  Segment type
                  <select
                    value={segmentType}
                    onChange={(e) =>
                      setSegmentType(e.target.value as typeof segmentType)
                    }
                  >
                    <option>Dynamic segment</option>
                    <option>Static group</option>
                  </select>
                </label>
                {segmentType === "Dynamic segment" ? (
                  <div className="filter-builder">
                    <b>
                      <Filter size={15} /> Define your audience
                    </b>
                    {rules.map((rule, index) => (
                      <div className="condition-row" key={index}>
                        <div className="field-pair">
                          <select
                            aria-label={`Field for condition ${index + 1}`}
                            value={rule.field}
                            onChange={(e) =>
                              setRules((current) =>
                                current.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, field: e.target.value }
                                    : item,
                                ),
                              )
                            }
                          >
                            <option>Category</option>
                            <option>Location</option>
                            <option>Status</option>
                            <option>Interest</option>
                            <option>Tag</option>
                            <option>Consent status</option>
                          </select>
                          <select
                            aria-label={`Operator for condition ${index + 1}`}
                            value={rule.operator}
                            onChange={(e) =>
                              setRules((current) =>
                                current.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, operator: e.target.value }
                                    : item,
                                ),
                              )
                            }
                          >
                            <option>is</option>
                            <option>is not</option>
                            <option>contains</option>
                          </select>
                          <select
                            aria-label={`Value for condition ${index + 1}`}
                            value={rule.value}
                            onChange={(e) =>
                              setRules((current) =>
                                current.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, value: e.target.value }
                                    : item,
                                ),
                              )
                            }
                          >
                            <option value="">Choose value</option>
                            {(rule.field === "Category"
                              ? categories
                              : rule.field === "Location"
                                ? Array.from(
                                    new Set(
                                      contacts
                                        .map((contact) => contact.location)
                                        .filter(Boolean),
                                    ),
                                  )
                                : rule.field === "Status" ||
                                    rule.field === "Consent status"
                                  ? ["Subscribed", "Pending", "Unsubscribed"]
                                  : rule.field === "Tag"
                                    ? Array.from(
                                        new Set(
                                          contacts.flatMap(
                                            (contact) => contact.tags ?? [],
                                          ),
                                        ),
                                      )
                                    : Array.from(
                                        new Set(
                                          contacts.flatMap(
                                            (contact) =>
                                              contact.interests ?? [],
                                          ),
                                        ),
                                      )
                            ).map((value) => (
                              <option key={value}>{value}</option>
                            ))}
                          </select>
                        </div>
                        {rules.length > 1 && (
                          <button
                            className="remove-condition"
                            type="button"
                            aria-label={`Remove condition ${index + 1}`}
                            onClick={() =>
                              setRules((current) =>
                                current.filter(
                                  (_, itemIndex) => itemIndex !== index,
                                ),
                              )
                            }
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setRules((current) => [
                          ...current,
                          { field: "Category", operator: "is", value: "" },
                        ])
                      }
                    >
                      <Plus size={14} /> Add condition
                    </button>
                  </div>
                ) : initialMembers.length > 0 ? (
                  <div className="selected-members">
                    <b>{initialMembers.length} selected contacts</b>
                    <small>
                      {initialMembers.map((contact) => contact.name).join(", ")}
                    </small>
                    <p className="modal-note">
                      These contacts will be saved as members of this static audience.
                    </p>
                  </div>
                ) : (
                  <p className="modal-note">
                    Save the static group, then add members from its audience profile.
                  </p>
                )}
              </>
            ) : (
              kind !== "template" && (
                <>
                  <label className="form-label">
                    Objective
                    <input
                      value={objective}
                      onChange={(e) => setObjective(e.target.value)}
                      placeholder="What would you like to achieve?"
                    />
                  </label>
                  <label className="form-label">
                    Target audience
                    <div className="audience-picker">
                      <button
                        type="button"
                        className={`audience-picker-trigger ${audiencePickerOpen ? "open" : ""}`}
                        aria-expanded={audiencePickerOpen}
                        onClick={() => setAudiencePickerOpen((open) => !open)}
                      >
                        <span>
                          {audiences.length
                            ? `${audiences.length} audience${audiences.length === 1 ? "" : "s"} selected`
                            : "Choose one or more audiences"}
                        </span>
                        <ChevronRight size={16} />
                      </button>
                      {audiences.length > 0 && (
                        <div className="audience-selected-list">
                          {audiences.map((name) => (
                            <span className="audience-chip" key={name}>
                              {name}
                              <button
                                type="button"
                                aria-label={`Remove ${name}`}
                                onClick={() =>
                                  setAudiences((current) =>
                                    current.filter((item) => item !== name),
                                  )
                                }
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      {audiencePickerOpen && (
                        <div
                          className="audience-picker-menu"
                          role="listbox"
                          aria-multiselectable="true"
                        >
                          <div className="audience-picker-search">
                            <Search size={14} />
                            <input
                              value={audienceSearch}
                              onChange={(event) =>
                                setAudienceSearch(event.target.value)
                              }
                              placeholder="Search audiences"
                              aria-label="Search audiences"
                            />
                          </div>
                          <div className="audience-picker-options">
                            {filteredAudienceChoices.map((item) => {
                              const checked = audiences.includes(item.name);
                              return (
                                <label
                                  className="audience-picker-option"
                                  key={item.name}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      setAudiences((current) =>
                                        checked
                                          ? current.filter(
                                              (name) => name !== item.name,
                                            )
                                          : Array.from(
                                              new Set([...current, item.name]),
                                            ),
                                      );
                                      if (!checked)
                                        setExcludedAudiences((current) =>
                                          current.filter(
                                            (name) => name !== item.name,
                                          ),
                                        );
                                    }}
                                  />
                                  <span>
                                    <b>{item.name}</b>
                                    <small>{item.detail}</small>
                                  </span>
                                  {checked && <Check size={15} />}
                                </label>
                              );
                            })}
                            {filteredAudienceChoices.length === 0 && (
                              <p className="audience-picker-empty">
                                No matching audiences.
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            className="audience-picker-done"
                            onClick={() => setAudiencePickerOpen(false)}
                          >
                            Done
                          </button>
                        </div>
                      )}
                    </div>
                  </label>
                  <details className="campaign-exclusions">
                    <summary>
                      Exclude audience groups{" "}
                      <small>
                        {excludedAudiences.length
                          ? `${excludedAudiences.length} selected`
                          : "Optional"}
                      </small>
                    </summary>
                    <div className="campaign-exclusion-list">
                      {audienceChoices.map((item) => (
                        <label key={item.name}>
                          <input
                            type="checkbox"
                            checked={excludedAudiences.includes(item.name)}
                            disabled={audiences.includes(item.name)}
                            onChange={(event) => {
                              if (event.target.checked) {
                                setExcludedAudiences((current) =>
                                  Array.from(new Set([...current, item.name])),
                                );
                                setAudiences((current) =>
                                  current.filter((name) => name !== item.name),
                                );
                              } else
                                setExcludedAudiences((current) =>
                                  current.filter((name) => name !== item.name),
                                );
                            }}
                          />
                          <span>
                            <b>{item.name}</b>
                            <small>{item.detail}</small>
                          </span>
                        </label>
                      ))}
                    </div>
                  </details>
                  <details className="campaign-exclusions">
                    <summary>
                      Exclude specific contacts{" "}
                      <small>
                        {excludedEmails.length
                          ? `${excludedEmails.length} selected`
                          : "Optional"}
                      </small>
                    </summary>
                    <div className="campaign-exclusion-list">
                      {contacts.map((contact) => (
                        <label key={contact.email}>
                          <input
                            type="checkbox"
                            checked={excludedEmails.includes(contact.email)}
                            onChange={(event) =>
                              setExcludedEmails((current) =>
                                event.target.checked
                                  ? [...current, contact.email]
                                  : current.filter(
                                      (email) => email !== contact.email,
                                    ),
                              )
                            }
                          />
                          <span>
                            <b>{contact.name}</b>
                            <small>
                              {contact.email} · {contact.status}
                            </small>
                          </span>
                        </label>
                      ))}
                    </div>
                  </details>
                  <p className="modal-note">
                    <ShieldCheck size={15} /> Suppress contacts without
                    permission for this channel before delivery. Imported
                    records do not grant consent, and this preview does not
                    resolve a live recipient list.
                  </p>
                  {kind === "email" && (
                    <label className="form-label">
                      Subject line
                      <input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Write a compelling subject line"
                      />
                    </label>
                  )}
                  {kind === "sms" && (
                    <label className="form-label">
                      Sender ID (optional)
                      <input
                        value={senderId}
                        onChange={(event) => setSenderId(event.target.value)}
                        maxLength={11}
                        placeholder="CEPHAS"
                      />
                      <small>
                        Sender ID approval and availability depend on the
                        connected provider and local rules.
                      </small>
                    </label>
                  )}
                  {kind === "email" && (
                    <>
                      <label className="form-label">
                        Images or attachments
                        <input
                          type="file"
                          accept="image/*,.pdf,.doc,.docx"
                          multiple
                          onChange={(event) =>
                            setAttachmentNames(
                              Array.from(event.target.files ?? []).map(
                                (file) => file.name,
                              ),
                            )
                          }
                        />
                        <small>
                          Files are listed in this local preview and are not
                          uploaded.
                        </small>
                        {attachmentNames.length > 0 && (
                          <span className="attachment-list">
                            {attachmentNames.join(" · ")}
                          </span>
                        )}
                      </label>
                    </>
                  )}
                  {kind === "email" ? (
                    <section className="email-editor">
                      <div className="email-editor-heading">
                        <div>
                          <b>Email content</b>
                          <small>Drag blocks to reorder your message.</small>
                        </div>
                        <span>
                          {emailBlocks.length} block
                          {emailBlocks.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div
                        className="email-editor-toolbar"
                        aria-label="Add email content block"
                      >
                        <button
                          type="button"
                          onClick={() => addEmailBlock("text")}
                        >
                          + Text
                        </button>
                        <button
                          type="button"
                          onClick={() => addEmailBlock("image")}
                        >
                          + Image
                        </button>
                        <button
                          type="button"
                          onClick={() => addEmailBlock("link")}
                        >
                          + Link
                        </button>
                        <button
                          type="button"
                          onClick={() => addEmailBlock("button")}
                        >
                          + Button
                        </button>
                        <button
                          type="button"
                          onClick={() => addEmailBlock("divider")}
                        >
                          + Divider
                        </button>
                      </div>
                      <div
                        className="email-editor-canvas"
                        onDragOver={(event) => event.preventDefault()}
                      >
                        {emailBlocks.map((block, index) => (
                          <article
                            className={`email-editor-block ${draggedBlockId === block.id ? "dragging" : ""}`}
                            key={block.id}
                            draggable
                            onDragStart={(event) => {
                              setDraggedBlockId(block.id);
                              event.dataTransfer.effectAllowed = "move";
                            }}
                            onDrop={(event) => {
                              event.preventDefault();
                              moveEmailBlock(block.id);
                            }}
                            onDragEnd={() => setDraggedBlockId(null)}
                          >
                            <div className="email-editor-block-head">
                              <span>
                                <GripVertical size={15} />{" "}
                                {block.type === "text"
                                  ? "Text"
                                  : block.type === "image"
                                    ? "Image"
                                    : block.type === "link"
                                      ? "Link"
                                      : block.type === "button"
                                        ? "Button"
                                        : "Divider"}
                              </span>
                              <div className="email-editor-block-actions">
                                <button
                                  type="button"
                                  aria-label={`Move ${block.type} block ${index + 1} up`}
                                  disabled={index === 0}
                                  onClick={() => shiftEmailBlock(block.id, -1)}
                                >
                                  Up
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Move ${block.type} block ${index + 1} down`}
                                  disabled={index === emailBlocks.length - 1}
                                  onClick={() => shiftEmailBlock(block.id, 1)}
                                >
                                  Down
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Remove ${block.type} block ${index + 1}`}
                                  onClick={() => removeEmailBlock(block.id)}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                            {block.type === "text" && (
                              <textarea
                                rows={3}
                                value={block.content}
                                onChange={(event) =>
                                  updateEmailBlock(block.id, {
                                    content: event.target.value,
                                  })
                                }
                                placeholder="Write your email content. Use {{first_name}} to personalise."
                              />
                            )}
                            {block.type === "image" && (
                              <label className="email-image-picker">
                                <ImageIcon size={18} />
                                <span>
                                  {block.content ||
                                    "Choose an image for this block"}
                                </span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(event) =>
                                    updateEmailBlock(block.id, {
                                      content:
                                        event.target.files?.[0]?.name ?? "",
                                    })
                                  }
                                />
                                <small>
                                  Image files are listed in this preview and are
                                  not uploaded.
                                </small>
                              </label>
                            )}
                            {(block.type === "link" ||
                              block.type === "button") && (
                              <div className="email-link-fields">
                                <input
                                  aria-label={`${block.type} label`}
                                  value={block.content}
                                  onChange={(event) =>
                                    updateEmailBlock(block.id, {
                                      content: event.target.value,
                                    })
                                  }
                                  placeholder={
                                    block.type === "button"
                                      ? "Button label"
                                      : "Link text"
                                  }
                                />
                                <input
                                  aria-label={`${block.type} URL`}
                                  type="url"
                                  value={block.url ?? ""}
                                  onChange={(event) =>
                                    updateEmailBlock(block.id, {
                                      url: event.target.value,
                                    })
                                  }
                                  placeholder="https://example.com"
                                />
                              </div>
                            )}
                            {block.type === "divider" && <hr />}
                          </article>
                        ))}
                        {emailBlocks.length === 0 && (
                          <p className="email-editor-empty">
                            Add a content block to start your email.
                          </p>
                        )}
                      </div>
                      <small className="count-hint">
                        Use the handle to drag blocks into a new order. Merge
                        fields such as {"{{first_name}}"} are preserved.
                      </small>
                    </section>
                  ) : (
                    <label className="form-label">
                      {kind === "sms" ? "SMS message" : "WhatsApp message"}
                      <textarea
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={
                          kind === "sms"
                            ? "Write your SMS message..."
                            : "Write your WhatsApp message..."
                        }
                      />
                    </label>
                  )}
                  <div className="campaign-preview-actions">
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => setPreviewOpen((open) => !open)}
                    >
                      {previewOpen ? "Hide preview" : "Preview message"}
                    </button>
                    {kind === "email" && (
                      <div className="campaign-test-row">
                        <input
                          aria-label="Test email address"
                          type="email"
                          placeholder="test@example.com"
                          value={testEmail}
                          onChange={(event) => setTestEmail(event.target.value)}
                        />
                        <button
                          type="button"
                          className="btn secondary"
                          onClick={() => {
                            if (!/^\S+@\S+\.\S+$/.test(testEmail)) {
                              setValidation(
                                "Enter a valid address for the test preview.",
                              );
                              return;
                            }
                            setValidation("");
                            recordAudit(
                              "Prepared campaign test preview",
                              `${campaignName} · ${testEmail}`,
                              "Campaign preview",
                            );
                            notify(
                              "Test preview prepared locally; no email was sent",
                            );
                          }}
                        >
                          Prepare test
                        </button>
                      </div>
                    )}
                  </div>
                  {previewOpen && (
                    <section className="message-preview">
                      <small>
                        {kind === "email"
                          ? `Subject: ${subject || "(no subject)"}`
                          : `${kind.toUpperCase()} PREVIEW`}
                      </small>
                      {kind === "email" ? (
                        <div className="email-preview-blocks">
                          {emailBlocks.map((block) =>
                            block.type === "text" ? (
                              <p key={block.id}>
                                {block.content.replaceAll(
                                  "{{first_name}}",
                                  "Amara",
                                )}
                              </p>
                            ) : block.type === "image" ? (
                              <div
                                className="email-preview-image"
                                key={block.id}
                              >
                                <ImageIcon size={18} />
                                <span>
                                  {block.content || "Image placeholder"}
                                </span>
                              </div>
                            ) : block.type === "divider" ? (
                              <hr key={block.id} />
                            ) : block.type === "button" ? (
                              <span
                                className="email-preview-button"
                                key={block.id}
                              >
                                {block.content || "Button"}
                              </span>
                            ) : (
                              <a
                                href={block.url || "#"}
                                key={block.id}
                                onClick={(event) => event.preventDefault()}
                              >
                                {block.content || block.url}
                              </a>
                            ),
                          )}
                          {attachmentNames.length > 0 && (
                            <small>
                              Attachments: {attachmentNames.join(", ")}
                            </small>
                          )}
                        </div>
                      ) : (
                        <p>
                          {message.replaceAll("{{first_name}}", "Amara") ||
                            "Your message preview will appear here."}
                        </p>
                      )}
                      <small>Personalization sample · Amara</small>
                    </section>
                  )}
                  <label className="form-label schedule-field">
                    Schedule delivery (optional)
                    <input
                      type="datetime-local"
                      value={scheduleAt}
                      onChange={(event) => setScheduleAt(event.target.value)}
                      min={new Date(
                        Date.now() +
                          60000 -
                          new Date().getTimezoneOffset() * 60000,
                      )
                        .toISOString()
                        .slice(0, 16)}
                    />
                    <small>
                      Scheduling is saved in this UI preview. A delivery
                      provider and scheduler are required to send.
                    </small>
                  </label>
                  {kind === "sms" ? (
                    <small className="count-hint">
                      {smsEstimate.characters} characters &middot;{" "}
                      {smsEstimate.units} {smsEstimate.encoding} units &middot;
                      up to {smsEstimate.capacity} units per part &middot;{" "}
                      {smsEstimate.parts} part
                      {smsEstimate.parts === 1 ? "" : "s"} &middot; illustrative
                      cost &#8358;{smsEstimate.parts * 5} per recipient at
                      sample rate &#8358;5/part
                      <br />
                      Actual encoding and pricing depend on the connected
                      provider.
                    </small>
                  ) : kind === "whatsapp" ? (
                    <div className="modal-note whatsapp-note">
                      <MessageCircle size={15} /> Send only to contacts who have
                      opted in. Business-initiated messages may require an
                      approved template from your connected provider.
                    </div>
                  ) : (
                    <div className="modal-note">
                      <Sparkles size={15} /> Personalise with merge fields like{" "}
                      {"{{first_name}}"}.
                    </div>
                  )}
                </>
              )
            )}
          </div>
        )}
        {validation && <p className="validation-message">{validation}</p>}
        <div className="modal-foot">
          <button className="btn secondary" onClick={close}>
            Cancel
          </button>
          <button className="btn primary" onClick={submit}>
            {kind === "add"
              ? "Add contact"
              : kind === "import"
                ? "Import contacts"
                : kind === "segment" || kind === "edit-audience"
                  ? kind === "edit-audience" ? "Save changes" : "Save audience"
                  : kind === "template"
                    ? "Save template"
                    : scheduleAt
                      ? "Schedule campaign"
                      : "Save as draft"}{" "}
            <ArrowUpRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
