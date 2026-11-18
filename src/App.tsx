import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Bell,
  CalendarDays,
  CircleCheck,
  CircleX,
  ChevronLeft,
  CircleHelp,
  ContactRound,
  FileText,
  LayoutDashboard,
  LoaderCircle,
  Mail,
  Menu,
  MessageCircle,
  MessageSquareText,
  Settings2,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";

import {
  contactFromApi,
  crmApi,
  type ApiCampaign,
  type ApiAnalytics,
  type ApiAuditEvent,
  type ApiContact,
} from "./api";
import type {
  Page,
  Contact,
  Campaign,
  AuditEvent,
  FilterRule,
  EmailBlock,
  TemplateDraft,
  AudienceRecord,
  AudienceDraft,
} from "./models";
import {
  campaignFromApi,
  audienceRulesFromApi,
  audienceRecordFromApi,
  templateFromApi,
} from "./models";
import {
  Badge,
  DeletePhraseInput,
  PageHeading,
  deletePhraseMatches,
} from "./components/Shared";
import { FeatureErrorBoundary } from "./components/FeatureErrorBoundary";
import { csvCell } from "./utils/csv";

type ToastKind = "success" | "error" | "loading";
type ToastNotice = { message: string; kind: ToastKind };

const auditEventToRow = (event: ApiAuditEvent): AuditEvent => {
  const type = event.eventType.toLowerCase();
  const color = type.includes("approv") || type.includes("sent") ? "green" : type.includes("export") ? "orange" : type.includes("contact") ? "blue" : "violet";
  return [event.actorName, event.action, event.details, event.eventType, new Date(event.createdAt).toLocaleString(), color];
};

const ContactsListPage = lazy(() =>
  import("./pages/ContactsPage").then((module) => ({
    default: module.ContactsListPage,
  })),
);
const CategoryManager = lazy(() =>
  import("./pages/CategoryManagerPage").then((module) => ({
    default: module.CategoryManager,
  })),
);
const ContactProfile = lazy(() =>
  import("./pages/ContactProfilePage").then((module) => ({
    default: module.ContactProfile,
  })),
);
const Dashboard = lazy(() =>
  import("./pages/DashboardPage").then((module) => ({
    default: module.Dashboard,
  })),
);
const CampaignPageFunctional = lazy(() =>
  import("./pages/CampaignsPage").then((module) => ({
    default: module.CampaignPageFunctional,
  })),
);
const AudienceProfile = lazy(() =>
  import("./pages/AudiencesPage").then((module) => ({
    default: module.AudienceProfile,
  })),
);
const AudiencesPreview = lazy(() =>
  import("./pages/AudiencesPage").then((module) => ({
    default: module.AudiencesPreview,
  })),
);
const TemplateLibrary = lazy(() =>
  import("./pages/TemplatesPage").then((module) => ({
    default: module.TemplateLibrary,
  })),
);
const ReportsDashboard = lazy(() =>
  import("./pages/ReportsPage").then((module) => ({
    default: module.ReportsDashboard,
  })),
);
const ScheduledPreview = lazy(() =>
  import("./pages/ScheduledPage").then((module) => ({
    default: module.ScheduledPreview,
  })),
);
const AuditLogPreview = lazy(() =>
  import("./pages/AuditLogPage").then((module) => ({
    default: module.AuditLogPreview,
  })),
);
const Settings = lazy(() =>
  import("./pages/SettingsPage").then((module) => ({
    default: module.Settings,
  })),
);
const HelpCentre = lazy(() =>
  import("./pages/HelpPage").then((module) => ({ default: module.HelpCentre })),
);
const NotificationsPage = lazy(() =>
  import("./pages/NotificationsPage").then((module) => ({
    default: module.NotificationsPage,
  })),
);
const ComingSoon = lazy(() =>
  import("./pages/NotificationsPage").then((module) => ({
    default: module.ComingSoon,
  })),
);
const ModalDialog = lazy(() =>
  import("./components/ModalDialog").then((module) => ({
    default: module.ModalDialog,
  })),
);

const normalizePath = (pathname: string) => {
  const normalized = `/${pathname.split("/").filter(Boolean).join("/")}`;
  return normalized === "/" ? normalized : normalized.replace(/\/$/, "");
};
const pageForPath = (pathname: string): Page => {
  const path = normalizePath(pathname).toLowerCase();
  if (path === "/" || path === "/dashboard") return "Dashboard";
  if (
    [
      "/contacts",
      "/contact",
      "/cinntacat",
      "/contacts/new",
      "/contact/edit",
      "/contacts/edit",
      "/contacts/categories",
    ].includes(path)
  )
    return path.endsWith("categories") ? "Categories" : "Contacts";
  if (/^\/(contacts|contact)\/[^/]+(\/edit)?$/.test(path))
    return "Contact profile";
  if (path === "/audiences") return "Audiences";
  if (/^\/audiences\/[^/]+$/.test(path)) return "Audience profile";
  if (path === "/help" || path === "/help-centre") return "Help centre";
  if (path === "/notifications") return "Notifications";
  if (["/campaigns", "/campaigns/email"].includes(path))
    return "Email campaigns";
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
const primaryNavItems: { name: Page; icon: typeof LayoutDashboard }[] = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Contacts", icon: ContactRound },
  { name: "Audiences", icon: Users },
];
const navGroups: {
  label: string;
  items: { name: Page; icon: typeof LayoutDashboard; badge?: string }[];
}[] = [
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
export function CRMApp({
  account,
  onSignOut,
}: {
  account: { name: string; email: string };
  onSignOut: () => Promise<string | null>;
}) {
  const accountName = account.name || account.email;
  const accountInitials = accountName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const [workspaceDisplayName, setWorkspaceDisplayName] = useState("Cephas People");
  const toastTimer = useRef<number | undefined>(undefined);
  const [page, setPage] = useState<Page>(() =>
      pageForPath(window.location.pathname),
    ),
    [contacts, setContacts] = useState<Contact[]>([]),
    [categories, setCategories] = useState<string[]>([]),
    [contactsLoading, setContactsLoading] = useState(true),
    [contactsError, setContactsError] = useState(""),
    [contactsReloadKey, setContactsReloadKey] = useState(0),
    [activeContact, setActiveContact] = useState<Contact | null>(null),
    [campaignRecords, setCampaignRecords] = useState<Campaign[]>([]),
    [campaignsLoading, setCampaignsLoading] = useState(true),
    [campaignsError, setCampaignsError] = useState(""),
    [campaignsReloadKey, setCampaignsReloadKey] = useState(0),
    [analytics, setAnalytics] = useState<ApiAnalytics | null>(null),
    [analyticsLoading, setAnalyticsLoading] = useState(true),
    [analyticsError, setAnalyticsError] = useState(""),
    [analyticsReloadKey, setAnalyticsReloadKey] = useState(0),
    [templateDrafts, setTemplateDrafts] = useState<TemplateDraft[]>([]),
    [templatesLoading, setTemplatesLoading] = useState(true),
    [templatesError, setTemplatesError] = useState(""),
    [templatesReloadKey, setTemplatesReloadKey] = useState(0),
    [campaignTemplateSeed, setCampaignTemplateSeed] =
      useState<TemplateDraft | null>(null),
    [campaignEditId, setCampaignEditId] = useState<string | null>(null),
    [activeAudience, setActiveAudience] = useState<AudienceRecord | null>(null),
    [audienceDrafts, setAudienceDrafts] = useState<AudienceDraft[]>([]),
    [audienceLoading, setAudienceLoading] = useState(true),
    [audienceError, setAudienceError] = useState(""),
    [audienceReloadKey, setAudienceReloadKey] = useState(0),
    [audienceProfileLoading, setAudienceProfileLoading] = useState(
      () => pageForPath(window.location.pathname) === "Audience profile",
    ),
    [audienceProfileError, setAudienceProfileError] = useState(""),
    [audienceEditSeed, setAudienceEditSeed] = useState<AudienceRecord | null>(
      null,
    ),
    [segmentSeedContacts, setSegmentSeedContacts] = useState<Contact[]>([]),
    [campaignAudienceSeed, setCampaignAudienceSeed] = useState(""),
    [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]),
    [auditReloadKey, setAuditReloadKey] = useState(0),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("All categories"),
    [statusFilter, setStatusFilter] = useState("All statuses"),
    [sortBy, setSortBy] = useState("Recently added"),
    [selected, setSelected] = useState<string[]>([]),
    [contactsPage, setContactsPage] = useState(0),
    [contactToDelete, setContactToDelete] = useState<Contact | null>(null),
    [confirmBulkDelete, setConfirmBulkDelete] = useState(false),
    [contactDeletePhrase, setContactDeletePhrase] = useState(""),
    [bulkDeletePhrase, setBulkDeletePhrase] = useState(""),
    [deletingContact, setDeletingContact] = useState(false),
    [deletingContacts, setDeletingContacts] = useState(false),
    [toast, setToast] = useState<ToastNotice | null>(null),
    [modal, setModal] = useState(() =>
      normalizePath(window.location.pathname).toLowerCase() === "/contacts/new"
        ? "add"
        : "",
    ),
    [pendingDuplicate, setPendingDuplicate] = useState<{
      existing: Contact;
      incoming: Contact;
      sourceId?: string;
    } | null>(null),
    [duplicateAction, setDuplicateAction] = useState<
      "merge" | "separate" | null
    >(null),
    [mobile, setMobile] = useState(false),
    [sidebarCollapsed, setSidebarCollapsed] = useState(false),
    [period, setPeriod] = useState("Last 30 days");
  const periodDays = period === "Last 7 days" ? 7 : period === "Last 90 days" ? 90 : 30;
  const analyticsForPeriod = analytics?.range.days === periodDays ? analytics : null;
  useEffect(() => {
    let active = true;
    crmApi.getSettings().then((response) => {
      if (active) setWorkspaceDisplayName(response.workspace.organizationName);
    }).catch(() => {
      // Keep the product name visible if preferences are temporarily unavailable.
    });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    crmApi.listAuditEvents({ limit: 100, offset: 0 })
      .then((result) => { if (active) setAuditEvents(result.items.map(auditEventToRow)); })
      .catch(() => { if (active) setAuditEvents([]); });
    return () => { active = false; };
  }, [auditReloadKey]);
  useEffect(() => {
    let active = true;
    setAnalyticsLoading(true);
    setAnalyticsError("");
    crmApi.getAnalytics(periodDays)
      .then((report) => { if (active) setAnalytics(report); })
      .catch((error: unknown) => {
        if (active) setAnalyticsError(error instanceof Error ? error.message : "Could not load analytics from the CRM API.");
      })
      .finally(() => { if (active) setAnalyticsLoading(false); });
    return () => { active = false; };
  }, [periodDays, analyticsReloadKey, campaignsReloadKey, contactsReloadKey, campaignRecords, contacts]);
  useEffect(() => {
    let active = true;
    setContactsLoading(true);
    setContactsError("");
    Promise.all([crmApi.listContacts(), crmApi.listCategories()])
      .then(([rows, categoryNames]) => {
        if (!active) return;
        const loaded = rows.map((row) => contactFromApi(row) as Contact);
        setContacts(loaded);
        setCategories(
          Array.from(
            new Set([
              ...categoryNames,
              ...loaded.map((contact) => contact.category),
            ]),
          ),
        );
      })
      .catch((error: unknown) => {
        if (!active) return;
        setContactsError(
          error instanceof Error
            ? error.message
            : "Could not connect to the CRM API",
        );
      })
      .finally(() => {
        if (active) setContactsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [contactsReloadKey]);
  useEffect(() => {
    let active = true;
    setAudienceLoading(true);
    setAudienceError("");
    crmApi
      .listAudiences()
      .then((rows) => {
        if (!active) return;
        setAudienceDrafts(
          rows.map((row): AudienceDraft => ({
            id: row.id,
            name: row.name,
            type: row.type === "dynamic" ? "Dynamic segment" : "Static group",
            description: row.description ?? "",
            rules: audienceRulesFromApi(row.rules),
            members: [],
            memberCount: row.memberCount,
            updatedAt: row.updatedAt,
          })),
        );
      })
      .catch((error: unknown) => {
        if (active)
          setAudienceError(
            error instanceof Error
              ? error.message
              : "Could not load audiences from the CRM API",
          );
      })
      .finally(() => {
        if (active) setAudienceLoading(false);
      });
    return () => {
      active = false;
    };
  }, [audienceReloadKey]);
  useEffect(() => {
    let active = true;
    setCampaignsLoading(true);
    setCampaignsError("");
    crmApi
      .listCampaigns()
      .then((rows) => {
        if (active) setCampaignRecords(rows.map(campaignFromApi));
      })
      .catch((error: unknown) => {
        if (active)
          setCampaignsError(
            error instanceof Error
              ? error.message
              : "Could not load campaigns from the CRM API",
          );
      })
      .finally(() => {
        if (active) setCampaignsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [campaignsReloadKey]);
  useEffect(() => {
    let active = true;
    setTemplatesLoading(true);
    setTemplatesError("");
    crmApi
      .listTemplates()
      .then((rows) => {
        if (active) setTemplateDrafts(rows.map(templateFromApi));
      })
      .catch((error: unknown) => {
        if (active)
          setTemplatesError(
            error instanceof Error
              ? error.message
              : "Could not load templates from the CRM API",
          );
      })
      .finally(() => {
        if (active) setTemplatesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [templatesReloadKey]);
  const toApiContact = (
    contact: Contact,
  ): Omit<ApiContact, "id" | "createdAt"> => {
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
      whatsappConsent: contact.whatsappStatus ?? "Pending",
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
  const visibleContacts = filtered.slice(
    contactsPage * pageSize,
    (contactsPage + 1) * pageSize,
  );
  useEffect(() => {
    setContactsPage(0);
  }, [query, category, statusFilter, sortBy]);
  useEffect(() => {
    setContactsPage((current) => Math.min(current, pageCount - 1));
  }, [pageCount]);
  const notify = (s: string, requestedKind?: ToastKind) => {
    if (toastTimer.current !== undefined) {
      window.clearTimeout(toastTimer.current);
      toastTimer.current = undefined;
    }
    const kind =
      requestedKind ??
      (/^(Could not|Unable to|Failed to|Error:|One or more|Some selected|This .* (?:is not|already|has no|are missing))/i.test(
        s,
      )
        ? "error"
        : "success");
    setToast({ message: s, kind });
    if (kind !== "loading") {
      toastTimer.current = window.setTimeout(
        () => {
          setToast(null);
          toastTimer.current = undefined;
        },
        kind === "error" ? 7000 : 4000,
      );
    }
  };
  const recordAudit = (activity: string, details: string, eventType: string) => {
    void crmApi.createAuditEvent({
      actorName: account.name || account.email,
      actorEmail: account.email,
      action: activity,
      details,
      eventType,
    }).then((event) => {
      setAuditEvents((rows) => [auditEventToRow(event), ...rows].slice(0, 100));
      setAuditReloadKey((key) => key + 1);
    }).catch((error: unknown) => {
      const detail = error instanceof Error ? error.message : "The audit service could not save this event.";
      notify(`Activity completed, but its audit record could not be saved: ${detail}`, "error");
    });
  };
  const go = (p: Page) => {
    const path =
      p === "Contact profile" && activeContact
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
    if (normalized !== window.location.pathname)
      window.history.replaceState({}, "", normalized);
    const syncRoute = () => {
      const routePath = normalizePath(window.location.pathname);
      const nextPage = pageForPath(routePath);
      setPage(nextPage);
      setSelected([]);
      const match = routePath.match(
        /^\/(?:contacts|contact)\/([^/]+)(?:\/edit)?$/i,
      );
      if (
        nextPage === "Contact profile" &&
        match &&
        match[1].toLowerCase() !== "edit"
      ) {
        const key = decodeURIComponent(match[1]);
        setActiveContact(
          contacts.find(
            (item) =>
              item.id === key || item.email.toLowerCase() === key.toLowerCase(),
          ) ?? null,
        );
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
    const match = normalizePath(window.location.pathname).match(
      /^\/(?:contacts|contact)\/([^/]+)(?:\/edit)?$/i,
    );
    if (!match || match[1].toLowerCase() === "edit") return;
    const key = decodeURIComponent(match[1]);
    const contact = contacts.find(
      (item) =>
        item.id === key || item.email.toLowerCase() === key.toLowerCase(),
    );
    setActiveContact(contact ?? null);
    if (contact && /\/edit$/i.test(normalizePath(window.location.pathname)))
      setModal("edit-contact");
    else if (!/\/edit$/i.test(normalizePath(window.location.pathname)))
      setModal("");
  }, [contacts, page]);
  useEffect(() => {
    if (page !== "Audience profile") return;
    const match = normalizePath(window.location.pathname).match(
      /^\/audiences\/([^/]+)$/i,
    );
    if (!match) {
      setActiveAudience(null);
      return;
    }
    const key = decodeURIComponent(match[1]);
    if (audienceLoading) return;
    const draft = audienceDrafts.find(
      (item) =>
        item.id === key || item.name.toLowerCase() === key.toLowerCase(),
    );
    if (!draft) {
      setActiveAudience(null);
      setAudienceProfileError(
        "This audience could not be found. Return to the audience list and refresh it.",
      );
      setAudienceProfileLoading(false);
      return;
    }
    let active = true;
    setAudienceProfileLoading(true);
    setAudienceProfileError("");
    crmApi
      .getAudience(draft.id)
      .then((saved) => {
        if (!active) return;
        const members = saved.members.map(
          (member) => contactFromApi(member.contact) as Contact,
        );
        setActiveAudience(audienceRecordFromApi(saved, members));
      })
      .catch((error: unknown) => {
        if (active)
          setAudienceProfileError(
            error instanceof Error
              ? error.message
              : "Could not load this audience from the API",
          );
      })
      .finally(() => {
        if (active) setAudienceProfileLoading(false);
      });
    return () => {
      active = false;
    };
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
      notify(`Review possible duplicate contact: ${duplicate.name}`, "error");
      return;
    }
    try {
      const saved = await crmApi.createContact(toApiContact(contact));
      const persisted = contactFromApi(saved) as Contact;
      setContacts((current) => [persisted, ...current]);
      setAudienceReloadKey((key) => key + 1);
      setCategories((current) =>
        current.includes(persisted.category)
          ? current
          : [...current, persisted.category],
      );
    } catch (error) {
      notify(
        `Could not save contact: ${error instanceof Error ? error.message : "API error"}`,
      );
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
      notify(`Review possible duplicate contact: ${duplicate.name}`, "error");
      return;
    }
    const existingContact = contacts.find(
      (item) => item.id === activeContact?.id,
    );
    if (!existingContact?.id) {
      notify("This sample contact is not stored in the CRM yet", "error");
      return;
    }
    let saved: ApiContact;
    try {
      saved = await crmApi.updateContact(
        existingContact.id,
        toApiContact(contact),
      );
    } catch (error) {
      notify(
        `Could not update contact: ${error instanceof Error ? error.message : "API error"}`,
      );
      return;
    }
    const persisted = contactFromApi(saved) as Contact;
    setContacts((current) =>
      current.map((item) =>
        item.id === existingContact.id ? persisted : item,
      ),
    );
    setAudienceReloadKey((key) => key + 1);
    setCategories((current) =>
      current.includes(persisted.category)
        ? current
        : [...current, persisted.category],
    );
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
      contact.whatsappStatus !== activeContact?.whatsappStatus
        ? `WhatsApp opt-in ${activeContact?.whatsappStatus ?? "Pending"} → ${contact.whatsappStatus ?? "Pending"}`
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
      whatsappStatus:
        existing.whatsappStatus === "Unsubscribed" ||
        incoming.whatsappStatus === "Unsubscribed"
          ? "Unsubscribed"
          : existing.whatsappStatus === "Pending" ||
              incoming.whatsappStatus === "Pending"
            ? "Pending"
            : existing.whatsappStatus === "Subscribed" &&
                incoming.whatsappStatus === "Subscribed"
              ? "Subscribed"
              : "Pending",
    };
    if (!existing.id) {
      notify(
        "The matching contact has no CRM record ID. Refresh contacts and try again.",
        "error",
      );
      return;
    }
    setDuplicateAction("merge");
    notify(`Merging ${incoming.name} with ${existing.name}...`, "loading");
    try {
      const saved = await crmApi.mergeContact(
        existing.id,
        pendingDuplicate.sourceId,
        toApiContact(merged),
      );
      const persisted = contactFromApi(saved) as Contact;
      setContacts((current) =>
        current
          .filter(
            (item) =>
              !pendingDuplicate.sourceId ||
              item.id !== pendingDuplicate.sourceId,
          )
          .map((item) => (item.id === existing.id ? persisted : item)),
      );
      setAudienceReloadKey((key) => key + 1);
      setCategories((current) =>
        current.includes(persisted.category)
          ? current
          : [...current, persisted.category],
      );
      if (
        activeContact?.id === existing.id ||
        activeContact?.id === pendingDuplicate.sourceId
      )
        setActiveContact(persisted);
    } catch (error) {
      notify(
        `Could not merge contact records: ${error instanceof Error ? error.message : "API error"}`,
        "error",
      );
      return;
    } finally {
      setDuplicateAction(null);
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
    if (
      pendingDuplicate.incoming.email.toLowerCase() ===
      pendingDuplicate.existing.email.toLowerCase()
    ) {
      notify(
        "This email address already belongs to the matching contact. Merge the records instead.",
      );
      return;
    }
    setDuplicateAction("separate");
    notify(
      `Saving ${pendingDuplicate.incoming.name} as a separate contact...`,
      "loading",
    );
    try {
      const saved = await crmApi.createContact(
        toApiContact(pendingDuplicate.incoming),
      );
      const persisted = contactFromApi(saved) as Contact;
      setContacts((current) => [persisted, ...current]);
      setAudienceReloadKey((key) => key + 1);
      setCategories((current) =>
        current.includes(persisted.category)
          ? current
          : [...current, persisted.category],
      );
    } catch (error) {
      notify(
        `Could not save separate contact: ${error instanceof Error ? error.message : "API error"}`,
        "error",
      );
      return;
    } finally {
      setDuplicateAction(null);
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
      notify(
        "This contact is not linked to an API record. Refresh the list and try again.",
      );
      return;
    }
    setDeletingContact(true);
    notify(`Deleting contact ${contact.name}...`, "loading");
    try {
      await crmApi.deleteContact(contact.id);
      setContacts((current) =>
        current.filter((item) => item.id !== contact.id),
      );
      setAudienceReloadKey((key) => key + 1);
      setSelected((current) =>
        current.filter((email) => email !== contact.email),
      );
      recordAudit(
        "Deleted contact",
        `${contact.name} · ${contact.email}`,
        "Contact deleted",
      );
      setContactToDelete(null);
      setContactDeletePhrase("");
      if (activeContact?.id === contact.id) {
        setActiveContact(null);
        go("Contacts");
      }
      notify(`${contact.name} deleted`);
    } catch (error) {
      notify(
        `Could not delete contact: ${error instanceof Error ? error.message : "API error"}`,
        "error",
      );
    } finally {
      setDeletingContact(false);
    }
  };
  const removeSelectedContacts = async () => {
    const targets = contacts.filter((contact) =>
      selectedVisible.includes(contact.email),
    );
    if (!targets.length) {
      setConfirmBulkDelete(false);
      return;
    }
    if (targets.some((contact) => !contact.id)) {
      notify(
        "One or more selected contacts are missing API IDs. Refresh the list and try again.",
      );
      setConfirmBulkDelete(false);
      return;
    }
    setDeletingContacts(true);
    notify(`Deleting ${targets.length} selected contacts...`, "loading");
    try {
      const result = await crmApi.deleteContacts(
        targets.map((contact) => contact.id!),
      );
      const deletedIds = new Set(result.ids);
      setContacts((current) =>
        current.filter((contact) => !deletedIds.has(contact.id ?? "")),
      );
      setAudienceReloadKey((key) => key + 1);
      setSelected([]);
      setConfirmBulkDelete(false);
      setBulkDeletePhrase("");
      recordAudit(
        "Deleted contacts",
        `${result.deleted} contact records`,
        "Contacts deleted",
      );
      notify(
        `${result.deleted} contact${result.deleted === 1 ? "" : "s"} deleted`,
      );
    } catch (error) {
      notify(
        `Could not delete selected contacts: ${error instanceof Error ? error.message : "API error"}`,
        "error",
      );
    } finally {
      setDeletingContacts(false);
    }
  };
  const addCampaignDraft = async (
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
    campaignId?: string | null,
    senderId = "",
    whatsappConfig?: {
      template: string;
      sender: string;
      mergeInfo: Record<string, string>;
    },
  ) => {
    notify(
      campaignId
        ? `Saving changes to ${name}...`
        : scheduledAt
          ? `Scheduling ${name}...`
          : `Saving ${channel} campaign ${name}...`,
      "loading",
    );
    let saved: Campaign;
    let scheduleFailure = "";
    if (channel === "Email") {
      const subjectMatch = message.match(/^Subject: ([^\n]*)\n\n/);
      const input = {
        name,
        objective,
        subject: subjectMatch?.[1] ?? "",
        blocks: emailBlocks ?? [],
        includedAudiences: targeting?.includedAudiences ?? [],
        excludedAudiences: targeting?.excludedAudiences ?? [],
        excludedContacts: targeting?.excludedContacts ?? [],
        attachments: attachments ?? [],
        ...(scheduledAt
          ? { scheduledAt: new Date(scheduledAt).toISOString() }
          : {}),
      };
      const result = campaignId
        ? await crmApi.updateCampaign(campaignId, input)
        : await crmApi.createCampaign(input);
      saved = campaignFromApi(result);
      if (scheduledAt && result.status !== "Scheduled")
        scheduleFailure =
          result.lastError || "Zoho Campaigns could not schedule the campaign";
    } else if (channel === "SMS") {
      const match = message.match(/\n\nSender ID: ([A-Za-z0-9]{3,11})$/);
      const body = message
        .replace(/\n\nSender ID: [A-Za-z0-9]{3,11}$/, "")
        .trim();
      const input = {
        name,
        channel: "SMS" as const,
        objective,
        subject: senderId || match?.[1] || "",
        blocks: [{ id: "sms-message", type: "text" as const, content: body }],
        includedAudiences: targeting?.includedAudiences ?? [],
        excludedAudiences: targeting?.excludedAudiences ?? [],
        excludedContacts: targeting?.excludedContacts ?? [],
        attachments: [],
      };
      const result = campaignId
        ? await crmApi.updateCampaign(campaignId, input)
        : await crmApi.createCampaign(input);
      saved = campaignFromApi(result);
    } else if (channel === "WhatsApp") {
      const input = {
        name,
        channel: "WhatsApp" as const,
        objective,
        subject: "",
        blocks: [],
        includedAudiences: targeting?.includedAudiences ?? [],
        excludedAudiences: targeting?.excludedAudiences ?? [],
        excludedContacts: targeting?.excludedContacts ?? [],
        attachments: [],
        whatsappTemplate: whatsappConfig?.template ?? "",
        whatsappSender: whatsappConfig?.sender ?? "",
        whatsappMergeInfo: whatsappConfig?.mergeInfo ?? {},
      };
      const result = campaignId
        ? await crmApi.updateCampaign(campaignId, input)
        : await crmApi.createCampaign(input);
      saved = campaignFromApi(result);
    } else {
      saved = {
        name,
        channel,
        audience: audience || "Not selected",
        status,
        reach: "—",
        engagement: "—",
        date: scheduledAt
          ? new Date(scheduledAt).toLocaleString()
          : new Date().toLocaleDateString(),
        tone: "green",
        objective,
        message,
        scheduledAt: scheduledAt || undefined,
        emailBlocks,
        attachments,
        ...targeting,
      };
    }
    setCampaignRecords((current) =>
      campaignId
        ? current.map((item) => (item.id === campaignId ? saved : item))
        : [saved, ...current],
    );
    recordAudit(
      campaignId
        ? `Updated ${channel} campaign`
        : status === "Scheduled"
          ? "Scheduled campaign"
          : "Created campaign draft",
      `${name} · ${channel}`,
      status === "Scheduled" ? "Campaign schedule" : "Campaign draft",
    );
    setModal("");
    setCampaignAudienceSeed("");
    setCampaignTemplateSeed(null);
    setCampaignEditId(null);
    notify(
      scheduleFailure
        ? `${name} saved as a draft. Scheduling failed: ${scheduleFailure}`
        : campaignId
          ? `${channel} campaign changes saved`
          : status === "Scheduled"
            ? `${channel} campaign saved and scheduled with Zoho Campaigns`
            : `${channel} campaign draft saved`,
      scheduleFailure ? "error" : "success",
    );
  };
  const updateCampaignRecord = (updated: ApiCampaign) => {
    const next = campaignFromApi(updated);
    setCampaignRecords((current) =>
      current.map((campaign) => (campaign.id === updated.id ? next : campaign)),
    );
    return next;
  };
  const requestCampaignApproval = async (campaign: Campaign) => {
    if (!campaign.id) return;
    updateCampaignRecord(await crmApi.requestCampaignApproval(campaign.id));
    recordAudit(
      "Submitted campaign for approval",
      campaign.name,
      "Campaign approval",
    );
    notify(`${campaign.name} submitted for approval`);
  };
  const approveCampaign = async (campaign: Campaign) => {
    if (!campaign.id) return;
    updateCampaignRecord(await crmApi.approveCampaign(campaign.id));
    recordAudit("Approved campaign", campaign.name, "Campaign approval");
    notify(`${campaign.name} approved and ready to send`);
  };
  const scheduleCampaign = async (campaign: Campaign) => {
    if (!campaign.id) return;
    const result = await crmApi.scheduleCampaign(campaign.id);
    updateCampaignRecord(result);
    recordAudit("Scheduled campaign", campaign.name, "Campaign schedule");
    notify(`${campaign.name} scheduled with Zoho Campaigns`);
  };
  const sendCampaign = async (campaign: Campaign) => {
    if (!campaign.id) return;
    const result = await crmApi.sendCampaign(campaign.id);
    updateCampaignRecord(result);
    recordAudit(
      campaign.channel === "SMS"
        ? "Submitted SMS campaign to Termii"
        : campaign.channel === "WhatsApp"
          ? "Queued WhatsApp campaign through Zoho CPaaS"
          : "Submitted email campaign to Zoho Campaigns",
      `${campaign.name} · ${result.delivery.sent} recipients · ${result.delivery.failed} errors`,
      "Campaign sent",
    );
    notify(
      result.delivery.failed
        ? `${campaign.name}: ${result.delivery.sent} sent, ${result.delivery.failed} failed. Review campaign details before retrying.`
        : campaign.channel === "SMS"
          ? `${campaign.name} accepted by Termii for ${result.delivery.sent} opted-in contacts`
          : campaign.channel === "WhatsApp"
            ? `${campaign.name}: Zoho CPaaS queued messages for ${result.delivery.sent} opted-in contacts. Refresh delivery to check receipts.`
            : `${campaign.name} submitted to Zoho Campaigns for ${result.delivery.sent} subscribed contacts`,
      result.delivery.failed ? "error" : "success",
    );
  };
  const refreshWhatsAppDelivery = async (campaign: Campaign) => {
    if (!campaign.id) return;
    const delivery = await crmApi.refreshWhatsAppDelivery(campaign.id);
    setCampaignRecords((current) =>
      current.map((item) =>
        item.id === campaign.id
          ? {
              ...item,
              status: delivery.status,
              lastError: delivery.lastError,
              reach: String(delivery.total),
              engagement: `${delivery.delivered} delivered · ${delivery.pending} pending · ${delivery.failed} failed`,
            }
          : item,
      ),
    );
    recordAudit(
      "Refreshed WhatsApp delivery status",
      `${campaign.name} · ${delivery.delivered} delivered · ${delivery.pending} pending · ${delivery.failed} failed`,
      "WhatsApp delivery",
    );
    notify(
      delivery.errors.length
        ? `Delivery status refreshed with ${delivery.errors.length} lookup error(s).`
        : `${delivery.delivered} delivered, ${delivery.pending} pending, ${delivery.failed} failed`,
      delivery.errors.length ? "error" : "success",
    );
  };
  const duplicateCampaign = (campaign: Campaign) => {
    setCampaignEditId(null);
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
    if (campaign.channel === "SMS") {
      subject = body.match(/\n\nSender ID: ([A-Za-z0-9]{3,11})$/)?.[1] ?? "";
      body = body.replace(/\n\nSender ID: [A-Za-z0-9]{3,11}$/, "");
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
      whatsappTemplate: campaign.whatsappTemplate,
      whatsappSender: campaign.whatsappSender,
      whatsappMergeInfo: campaign.whatsappMergeInfo,
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
    notify(`Duplicate draft ready to review: ${copyName}`);
  };
  const editCampaign = (campaign: Campaign) => {
    if (!campaign.id || campaign.status !== "Draft") return;
    const subject =
      campaign.channel === "Email"
        ? (campaign.message?.match(/^Subject: ([^\n]*)/)?.[1] ?? "")
        : campaign.channel === "SMS"
          ? (campaign.message?.match(
              /\n\nSender ID: ([A-Za-z0-9]{3,11})$/,
            )?.[1] ?? "")
          : "";
    const body =
      campaign.channel === "SMS"
        ? (campaign.message ?? "").replace(
            /\n\nSender ID: [A-Za-z0-9]{3,11}$/,
            "",
          )
        : "";
    setCampaignTemplateSeed({
      name: campaign.name,
      channel: campaign.channel,
      subject,
      body,
      emailBlocks: campaign.emailBlocks ?? [],
      attachments: campaign.attachments,
      objective: campaign.objective,
      excludedAudiences: campaign.excludedAudiences,
      excludedContacts: campaign.excludedContacts,
      whatsappTemplate: campaign.whatsappTemplate,
      whatsappSender: campaign.whatsappSender,
      whatsappMergeInfo: campaign.whatsappMergeInfo,
    });
    setCampaignAudienceSeed(campaign.includedAudiences?.join(", ") ?? "");
    setCampaignEditId(campaign.id);
    setModal(
      campaign.channel === "Email"
        ? "email"
        : campaign.channel === "SMS"
          ? "sms"
          : "whatsapp",
    );
    notify(
      `Editing ${campaign.channel.toLowerCase()} campaign: ${campaign.name}`,
    );
  };
  const cancelScheduled = async (campaign: Campaign) => {
    if (!campaign.id) return;
    updateCampaignRecord(await crmApi.cancelCampaign(campaign.id));
    recordAudit(
      "Cancelled scheduled campaign",
      campaign.name,
      "Campaign schedule",
    );
    notify(`${campaign.name} cancelled`);
  };
  const toggleScheduledPause = async (campaign: Campaign, paused: boolean) => {
    if (!campaign.id) return;
    updateCampaignRecord(await crmApi.pauseCampaign(campaign.id, paused));
    recordAudit(
      paused ? "Paused scheduled campaign" : "Resumed scheduled campaign",
      campaign.name,
      "Campaign schedule",
    );
    notify(
      paused
        ? `${campaign.name} paused`
        : `${campaign.name} returned to the schedule`,
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
    const contactIds =
      type === "Static group"
        ? resolvedMembers
            .map((contact) => contact.id)
            .filter((id): id is string => Boolean(id))
        : [];
    if (
      !audienceId &&
      type === "Static group" &&
      contactIds.length !== resolvedMembers.length
    ) {
      notify(
        "Some selected contacts are not synced with the CRM API. Refresh contacts and retry.",
        "error",
      );
      return;
    }
    let savedAudience;
    try {
      const payload = {
        name,
        type:
          type === "Dynamic segment"
            ? ("dynamic" as const)
            : ("static" as const),
        description:
          description?.trim() ||
          (type === "Dynamic segment"
            ? `${rules.length} saved conditions`
            : `${resolvedMembers.length} selected contacts`),
        rules: type === "Dynamic segment" ? rules : [],
        ...(type === "Static group" ? { contactIds } : {}),
      };
      savedAudience = audienceId
        ? await crmApi.updateAudience(audienceId, payload)
        : await crmApi.createAudience(payload);
    } catch (error) {
      notify(
        `Could not ${audienceId ? "update" : "save"} audience: ${error instanceof Error ? error.message : "API error"}`,
      );
      return;
    }
    const savedMembers = type === "Static group" ? resolvedMembers : [];
    const record = audienceRecordFromApi(savedAudience, savedMembers);
    setActiveAudience(record);
    setAudienceDrafts((current) =>
      audienceId
        ? current.map((audience) =>
            audience.id === audienceId
              ? {
                  ...audience,
                  id: record.id,
                  name: record.name,
                  type: record.type,
                  description: record.description,
                  rules: record.rules,
                  members: savedMembers,
                  memberCount: Number(record.count),
                  updatedAt: savedAudience.updatedAt,
                }
              : audience,
          )
        : [
            {
              id: record.id,
              name: record.name,
              type: record.type,
              description: record.description,
              rules: record.rules,
              members: savedMembers,
              memberCount: Number(record.count),
              updatedAt: savedAudience.updatedAt,
            },
            ...current,
          ],
    );
    recordAudit(
      audienceId ? "Updated audience" : "Created audience",
      `${name} · ${type} · ${savedAudience.memberCount ?? resolvedMembers.length} contacts · ${rules.length} conditions`,
      audienceId ? "Audience updated" : "Audience created",
    );
    setModal("");
    setAudienceEditSeed(null);
    notify(
      `${name} ${audienceId ? "updated" : "saved"} with ${savedAudience.memberCount ?? resolvedMembers.length} contacts`,
    );
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
    window.history.pushState(
      {},
      "",
      `/audiences/${encodeURIComponent(audience.id)}`,
    );
    setActiveAudience(audience);
    setAudienceProfileLoading(true);
    setAudienceProfileError("");
    setPage("Audience profile");
    setSelected([]);
    recordAudit("Viewed audience details", audience.name, "Audience viewed");
  };
  const refreshAudience = async (id: string) => {
    const saved = await crmApi.getAudience(id);
    const members = saved.members.map(
      (member) => contactFromApi(member.contact) as Contact,
    );
    const record = audienceRecordFromApi(saved, members);
    setActiveAudience(record);
    setAudienceDrafts((current) =>
      current.map((audience) =>
        audience.id === id
          ? {
              ...audience,
              name: record.name,
              type: record.type,
              description: record.description,
              rules: record.rules,
              members,
              memberCount: Number(record.count),
              updatedAt: saved.updatedAt,
            }
          : audience,
      ),
    );
  };
  const addMembersToAudience = async (id: string, contactIds: string[]) => {
    let added = 0;
    try {
      const result = await crmApi.addAudienceMembers(id, contactIds);
      added = result.added;
    } catch (error) {
      notify(
        `Could not add audience members: ${error instanceof Error ? error.message : "API error"}`,
      );
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
      notify(
        `Could not remove audience member: ${error instanceof Error ? error.message : "API error"}`,
      );
      throw error;
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
      setAudienceDrafts((current) =>
        current.filter((audience) => audience.id !== activeAudience.id),
      );
      recordAudit("Deleted audience", activeAudience.name, "Audience deleted");
      setActiveAudience(null);
      go("Audiences");
      notify(`${activeAudience.name} deleted`);
    } catch (error) {
      notify(
        `Could not delete audience: ${error instanceof Error ? error.message : "API error"}`,
      );
      throw error;
    }
  };
  const createCategory = async (name: string): Promise<string | null> => {
    try {
      const created = await crmApi.createCategory(name);
      setCategories((current) =>
        current.includes(created.name) ? current : [...current, created.name],
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "API error";
      notify(`Could not create category: ${message}`);
      return message;
    }
    recordAudit("Created contact category", name, "Category created");
    notify(`${name} category created in the CRM`);
    return null;
  };
  const renameCategory = async (
    previous: string,
    next: string,
  ): Promise<string | null> => {
    try {
      const renamed = await crmApi.renameCategory(previous, next);
      next = renamed.name;
    } catch (error) {
      const message = error instanceof Error ? error.message : "API error";
      notify(`Could not rename category: ${message}`);
      return message;
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
    return null;
  };
  const deleteCategory = async (name: string): Promise<string | null> => {
    const fallback =
      categories.find((categoryName) => categoryName !== name) ??
      "Uncategorized";
    const affected = contacts.filter(
      (contact) => contact.category === name,
    ).length;
    try {
      await crmApi.deleteCategory(name, fallback);
    } catch (error) {
      const message = error instanceof Error ? error.message : "API error";
      notify(`Could not delete category: ${message}`);
      return message;
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
    return null;
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
    notify(`Campaign draft started from template: ${template.name}`);
  };
  const saveTemplateDraft = async (template: TemplateDraft) => {
    notify(
      `${template.id ? "Saving changes to" : "Creating"} template ${template.name}...`,
      "loading",
    );
    const input = {
      name: template.name,
      channel: template.channel,
      subject: template.subject,
      body: template.body,
      emailBlocks: template.emailBlocks ?? [],
      attachments: template.attachments ?? [],
      objective: template.objective ?? "",
      whatsappTemplate: template.whatsappTemplate ?? null,
      whatsappSender: template.whatsappSender ?? null,
      whatsappMergeInfo: template.whatsappMergeInfo ?? {},
    };
    const saved = template.id
      ? await crmApi.updateTemplate(template.id, input)
      : await crmApi.createTemplate(input);
    const savedDraft = templateFromApi(saved);
    setTemplateDrafts((current) =>
      template.id
        ? current.map((item) => (item.id === template.id ? savedDraft : item))
        : [...current, savedDraft].sort((a, b) => a.name.localeCompare(b.name)),
    );
    const { name, channel } = template;
    recordAudit(
      template.id ? "Updated template" : "Created template",
      `${name} · ${channel}`,
      "Template",
    );
    setModal("");
    setCampaignTemplateSeed(null);
    notify(
      template.id
        ? `Template updated: ${template.name}`
        : `Template created: ${template.name}`,
    );
  };
  const deleteTemplate = async (template: TemplateDraft) => {
    if (!template.id) {
      const error = `Template ${template.name} has no CRM record ID and cannot be deleted.`;
      notify(error, "error");
      throw new Error(error);
    }
    notify(`Deleting template ${template.name}...`, "loading");
    try {
      await crmApi.deleteTemplate(template.id);
      setTemplateDrafts((current) =>
        current.filter((item) => item.id !== template.id),
      );
      recordAudit("Deleted template", template.name, "Template");
      notify(`${template.name} deleted`);
    } catch (error) {
      notify(
        `Could not delete template ${template.name}: ${error instanceof Error ? error.message : "API error"}`,
        "error",
      );
      throw error;
    }
  };
  const editTemplate = (template: TemplateDraft) => {
    setCampaignTemplateSeed(template);
    setModal("template");
  };
  const useSavedTemplate = async (template: TemplateDraft) => {
    openCampaignFromTemplate(template);
    if (!template.id) return;
    try {
      const updated = await crmApi.useTemplate(template.id);
      setTemplateDrafts((current) =>
        current.map((item) =>
          item.id === updated.id
            ? { ...item, useCount: updated.useCount }
            : item,
        ),
      );
    } catch {
      /* Campaign setup remains available even if usage tracking is unavailable. */
    }
  };
  const exportCsv = (rows: Contact[] = filtered) => {
    const csv = [
      "Name,Email,Alternate_Emails,Phone,Organization,Category,Location,Interests,Tags,Email_Consent_Status,SMS_Consent_Status,WhatsApp_Consent_Status",
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
          c.whatsappStatus ?? "Pending",
        ]
          .map(csvCell)
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
        whatsappStatus,
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
        WhatsApp_Consent_Status: whatsappStatus ?? "Pending",
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
  const importCsv = (file: File): Promise<void> => {
    const isExcel = /\.xlsx?$/i.test(file.name);
    const content = isExcel
      ? file.arrayBuffer().then(async (data) => {
          const XLSX = await import("xlsx");
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          return firstSheet ? XLSX.utils.sheet_to_csv(firstSheet) : "";
        })
      : file.text();
    return content
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
          throw new Error("The selected CSV is empty.");
        }
        const headers = headerRow.map((h) =>
          h.toLowerCase().replaceAll(/[\s-]+/g, "_"),
        );
        const index = (...keys: string[]) =>
          headers.findIndex((h) => keys.includes(h));
        const emailAt = index("email", "email_address");
        if (emailAt < 0) {
          throw new Error("The file needs an Email or Email address column.");
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
          smsConsentAt = index("sms_consent_status", "sms_opt_in_status"),
          whatsappConsentAt = index(
            "whatsapp_consent_status",
            "whatsapp_opt_in_status",
          );
        const phoneAt = index("phone", "phone_number", "mobile"),
          organizationAt = index("organization", "organisation", "company"),
          interestsAt = index("interests", "interest"),
          tagsAt = index("tags", "tag");
        const alternateEmailsAt = index(
          "alternate_emails",
          "alternate_email",
          "secondary_emails",
        );
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
              ? (values[nameAt] ?? "")
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
          const whatsappConsentValue =
            whatsappConsentAt >= 0
              ? values[whatsappConsentAt]?.toLowerCase()
              : "";
          const whatsappStatus: Contact["status"] =
            whatsappConsentValue === "subscribed" ||
            whatsappConsentValue === "consented" ||
            whatsappConsentValue === "opted_in"
              ? "Subscribed"
              : whatsappConsentValue === "unsubscribed" ||
                  whatsappConsentValue === "opted_out"
                ? "Unsubscribed"
                : "Pending";
          return [
            {
              name,
              email,
              alternateEmails:
                alternateEmailsAt >= 0
                  ? (values[alternateEmailsAt] ?? "")
                      .split(/[;,]/)
                      .map((value) => value.trim().toLowerCase())
                      .filter(Boolean)
                  : [],
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
              whatsappStatus,
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
          const persistedPartial = importedContacts.map(
            (contact) => contactFromApi(contact) as Contact,
          );
          if (persistedPartial.length) {
            setContacts((current) => [...persistedPartial, ...current]);
            setAudienceReloadKey((key) => key + 1);
            setCategories((current) =>
              Array.from(
                new Set([
                  ...current,
                  ...persistedPartial.map((contact) => contact.category),
                ]),
              ),
            );
            setModal("");
            notify(
              `${persistedPartial.length} contacts imported before the import stopped: ${error instanceof Error ? error.message : "API error"}. You can retry the file; existing emails will be skipped.`,
              "error",
            );
            return;
          }
          throw error;
        }
        const persisted = importedContacts.map(
          (contact) => contactFromApi(contact) as Contact,
        );
        setContacts((current) => [...persisted, ...current]);
        setAudienceReloadKey((key) => key + 1);
        setCategories((current) =>
          Array.from(
            new Set([
              ...current,
              ...persisted.map((contact) => contact.category),
            ]),
          ),
        );
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
      .catch((error: unknown) => {
        throw error instanceof Error
          ? error
          : new Error(
              "Could not import contacts. Check the file and API connection.",
            );
      });
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
          <nav className="top-nav" aria-label="Primary navigation">
            {primaryNavItems.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => go(item.name)}
                className={`top-nav-item ${page === item.name || (page === "Audience profile" && item.name === "Audiences") || (page === "Categories" && item.name === "Contacts") ? "active" : ""}`}
                aria-current={page === item.name ? "page" : undefined}
              >
                <item.icon size={16} />
                <span>{item.name}</span>
                {item.name === "Contacts" && (
                  <span className="top-nav-count">{contacts.length}</span>
                )}
              </button>
            ))}
          </nav>
          <div className="top-actions">
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
          <FeatureErrorBoundary>
            <Suspense
              fallback={
                <div className="empty-state" role="status">
                  <LoaderCircle size={20} className="auth-spinner" />
                  <b>Loading page</b>
                  <span>Preparing this workspace section.</span>
                </div>
              }
            >
              {page === "Dashboard" && (
                <Dashboard setPage={go} period={period} setPeriod={setPeriod} accountName={account.name || account.email} analytics={analyticsForPeriod} loading={analyticsLoading} error={analyticsError} retry={() => setAnalyticsReloadKey((key) => key + 1)} campaigns={campaignRecords} campaignsLoading={campaignsLoading} campaignsError={campaignsError} retryCampaigns={() => setCampaignsReloadKey((key) => key + 1)} />
              )}
              {page === "Contacts" && (
                <ContactsListPage
                  contacts={contacts}
                  categories={categories}
                  filtered={filtered}
                  visibleContacts={visibleContacts}
                  selectedVisible={selectedVisible}
                  selected={selected}
                  contactsLoading={contactsLoading}
                  contactsError={contactsError}
                  query={query}
                  setQuery={setQuery}
                  category={category}
                  setCategory={setCategory}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  setModal={setModal}
                  exportCsv={exportCsv}
                  exportExcel={exportExcel}
                  go={go}
                  openAudienceBuilder={openAudienceBuilder}
                  setBulkDeletePhrase={setBulkDeletePhrase}
                  setConfirmBulkDelete={setConfirmBulkDelete}
                  contactsReload={() => setContactsReloadKey((key) => key + 1)}
                  setSelected={setSelected}
                  toggle={toggle}
                  openContactProfile={openContactProfile}
                  contactsPage={contactsPage}
                  pageSize={pageSize}
                  pageCount={pageCount}
                  setContactsPage={setContactsPage}
                />
              )}
              {page === "Categories" && (
                <CategoryManager
                  categories={categories}
                  contacts={contacts}
                  loading={contactsLoading}
                  loadError={contactsError}
                  retry={() => setContactsReloadKey((key) => key + 1)}
                  onBack={() => go("Contacts")}
                  onCreate={createCategory}
                  onRename={renameCategory}
                  onDelete={deleteCategory}
                />
              )}
              {page === "Contact profile" && activeContact && (
                <ContactProfile
                  key={activeContact.id || activeContact.email}
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
                  onEmailSent={() =>
                    recordAudit(
                      "Sent a personal email",
                      `${activeContact.name} · ${activeContact.email}`,
                      "Email sent",
                    )
                  }
                  onEdit={() => {
                    const key = activeContact.id || activeContact.email;
                    window.history.pushState(
                      {},
                      "",
                      `/contacts/${encodeURIComponent(key)}/edit`,
                    );
                    setModal("edit-contact");
                  }}
                  onDelete={() => {
                    setContactDeletePhrase("");
                    setContactToDelete(activeContact);
                  }}
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
                  action={
                    <button
                      className="btn secondary"
                      onClick={() => go("Contacts")}
                    >
                      Back to contacts
                    </button>
                  }
                />
              )}
              {page === "Audiences" && (
                <AudiencesPreview
                  drafts={audienceDrafts}
                  loading={audienceLoading}
                  error={audienceError}
                  retry={() => setAudienceReloadKey((key) => key + 1)}
                  setModal={() => {
                    setAudienceEditSeed(null);
                    openAudienceBuilder();
                  }}
                  onView={openAudienceDetails}
                  openCampaign={openCampaignForAudience}
                />
              )}
              {page === "Audience profile" && audienceProfileLoading && (
                <div className="empty-state">
                  <LoaderCircle size={20} className="auth-spinner" />
                  <b>Loading audience</b>
                  <span>Fetching saved audience rules and members.</span>
                </div>
              )}
              {page === "Audience profile" && audienceProfileError && (
                <div className="empty-state" role="alert">
                  <Activity size={20} />
                  <b>Audience could not be loaded</b>
                  <span>{audienceProfileError}</span>
                  <button
                    className="btn secondary"
                    onClick={() => setAudienceReloadKey((key) => key + 1)}
                  >
                    Retry
                  </button>
                </div>
              )}
              {page === "Audience profile" &&
                activeAudience &&
                !audienceProfileLoading &&
                !audienceProfileError && (
                  <AudienceProfile
                    audience={activeAudience}
                    contacts={contacts}
                    onBack={() => go("Audiences")}
                    openCampaign={openCampaignForAudience}
                    onEdit={() => {
                      setAudienceEditSeed(activeAudience);
                      setSegmentSeedContacts(activeAudience.members);
                      setModal("edit-audience");
                    }}
                    onDelete={deleteActiveAudience}
                    onAddMembers={(ids) =>
                      addMembersToAudience(activeAudience.id, ids)
                    }
                    onRemoveMember={(contactId) =>
                      removeAudienceMember(activeAudience.id, contactId)
                    }
                  />
                )}
              {page === "Audience profile" &&
                !activeAudience &&
                !audienceProfileLoading &&
                !audienceProfileError && (
                  <PageHeading
                    eyebrow="AUDIENCES"
                    title="Audience not found"
                    desc="Open the audience list and choose a group to view its profile."
                    action={
                      <button
                        className="btn secondary"
                        onClick={() => go("Audiences")}
                      >
                        Back to audiences
                      </button>
                    }
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
                  loading={campaignsLoading}
                  error={campaignsError}
                  reload={() => setCampaignsReloadKey((key) => key + 1)}
                  setModal={setModal}
                  notify={notify}
                  recordAudit={recordAudit}
                  requestApproval={requestCampaignApproval}
                  approveCampaign={approveCampaign}
                  scheduleCampaign={scheduleCampaign}
                  editCampaign={editCampaign}
                  sendCampaign={sendCampaign}
                  refreshWhatsAppDelivery={refreshWhatsAppDelivery}
                  duplicateCampaign={duplicateCampaign}
                />
              )}
              {page === "Bulk SMS" && (
                <CampaignPageFunctional
                  channel="SMS"
                  records={campaignRecords}
                  loading={campaignsLoading}
                  error={campaignsError}
                  reload={() => setCampaignsReloadKey((key) => key + 1)}
                  setModal={setModal}
                  notify={notify}
                  recordAudit={recordAudit}
                  requestApproval={requestCampaignApproval}
                  approveCampaign={approveCampaign}
                  scheduleCampaign={scheduleCampaign}
                  editCampaign={editCampaign}
                  sendCampaign={sendCampaign}
                  refreshWhatsAppDelivery={refreshWhatsAppDelivery}
                  duplicateCampaign={duplicateCampaign}
                />
              )}
              {page === "WhatsApp" && (
                <CampaignPageFunctional
                  channel="WhatsApp"
                  records={campaignRecords}
                  loading={campaignsLoading}
                  error={campaignsError}
                  reload={() => setCampaignsReloadKey((key) => key + 1)}
                  setModal={setModal}
                  notify={notify}
                  recordAudit={recordAudit}
                  requestApproval={requestCampaignApproval}
                  approveCampaign={approveCampaign}
                  scheduleCampaign={scheduleCampaign}
                  editCampaign={editCampaign}
                  sendCampaign={sendCampaign}
                  refreshWhatsAppDelivery={refreshWhatsAppDelivery}
                  duplicateCampaign={duplicateCampaign}
                />
              )}
              {page === "Templates" && (
                <TemplateLibrary
                  drafts={templateDrafts}
                  setModal={setModal}
                  loading={templatesLoading}
                  error={templatesError}
                  reload={() => setTemplatesReloadKey((key) => key + 1)}
                  useTemplate={useSavedTemplate}
                  editTemplate={editTemplate}
                  deleteTemplate={deleteTemplate}
                />
              )}
              {page === "Scheduled" && (
                <ScheduledPreview
                  records={campaignRecords}
                  loading={campaignsLoading}
                  error={campaignsError}
                  reload={() => setCampaignsReloadKey((key) => key + 1)}
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
                  analytics={analyticsForPeriod}
                  loading={analyticsLoading}
                  error={analyticsError}
                  retry={() => setAnalyticsReloadKey((key) => key + 1)}
                  campaigns={campaignRecords}
                  campaignsLoading={campaignsLoading}
                  campaignsError={campaignsError}
                  retryCampaigns={() => setCampaignsReloadKey((key) => key + 1)}
                />
              )}
              {page === "Audit log" && (
                <AuditLogPreview
                  notify={notify}
                  recordAudit={recordAudit}
                  reloadKey={auditReloadKey}
                />
              )}
              {page === "Settings" && (
                <Settings
                  account={account}
                  onSignOut={onSignOut}
                  notify={notify}
                  recordAudit={recordAudit}
                  onWorkspaceNameChange={setWorkspaceDisplayName}
                />
              )}
              {page === "Leads" && <ComingSoon />}
            </Suspense>
          </FeatureErrorBoundary>
          <footer className="footer">
            <span>© {new Date().getFullYear()} {workspaceDisplayName}</span>
            <span>
              {page === "Email campaigns"
                ? "Campaign records via CRM API"
                : `${workspaceDisplayName} CRM`}
            </span>
            <span>
              {page === "Email campaigns"
                ? "Delivery via Zoho Campaigns"
                : "Workspace"}
            </span>
          </footer>
        </div>
      </main>
      {modal && (
        <FeatureErrorBoundary>
          <Suspense
            fallback={
              <div className="modal-loading" role="status">
                <LoaderCircle size={20} className="auth-spinner" /> Loading
                editor…
              </div>
            }
          >
            <ModalDialog
              kind={modal}
              close={() => {
                normalizeModalRoute();
                setModal("");
                setCampaignAudienceSeed("");
                setCampaignTemplateSeed(null);
                setCampaignEditId(null);
                setAudienceEditSeed(null);
                setSegmentSeedContacts([]);
              }}
              saveContact={
                modal === "edit-contact" ? updateContact : addContact
              }
              initialContact={modal === "edit-contact" ? activeContact : null}
              campaignNames={campaignRecords
                .filter((campaign) => campaign.id !== campaignEditId)
                .map((campaign) => campaign.name)}
              categories={categories}
              saveDraft={addCampaignDraft}
              campaignEditId={campaignEditId}
              saveAudience={addAudienceDraft}
              initialMembers={
                modal === "edit-audience"
                  ? (audienceEditSeed?.members ?? [])
                  : segmentSeedContacts
              }
              initialAudienceRecord={
                modal === "edit-audience" ? audienceEditSeed : null
              }
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
              saveTemplate={saveTemplateDraft}
              importContacts={importCsv}
              recordAudit={recordAudit}
              notify={notify}
            />
          </Suspense>
        </FeatureErrorBoundary>
      )}
      {pendingDuplicate && (
        <div
          className="modal-backdrop"
          role="presentation"
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
                disabled={duplicateAction !== null}
                onClick={() => setPendingDuplicate(null)}
              >
                Cancel
              </button>
              {pendingDuplicate.existing.email.toLowerCase() !==
                pendingDuplicate.incoming.email.toLowerCase() && (
                <button
                  className="btn secondary"
                  disabled={duplicateAction !== null}
                  onClick={() => void keepDuplicateSeparate()}
                >
                  {duplicateAction === "separate" ? "Saving..." : "Keep both"}
                </button>
              )}
              <button
                className="btn primary"
                disabled={duplicateAction !== null}
                onClick={() => void mergeDuplicateContact()}
              >
                {duplicateAction === "merge" ? "Merging..." : "Merge safely"}
              </button>
            </div>
          </section>
        </div>
      )}
      {contactToDelete && (
        <div
          className="category-confirm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-contact-title"
        >
          <div className="category-confirm-card">
            <div className="danger-icon">
              <Trash2 size={18} />
            </div>
            <h2 id="delete-contact-title">Delete {contactToDelete.name}?</h2>
            <p>
              This permanently removes the contact record from your CRM. Any
              audience memberships for this contact will also be removed.
            </p>
            <DeletePhraseInput
              value={contactDeletePhrase}
              onChange={setContactDeletePhrase}
              disabled={deletingContact}
            />
            <div className="category-confirm-actions">
              <button
                className="btn secondary"
                disabled={deletingContact}
                onClick={() => {
                  setContactToDelete(null);
                  setContactDeletePhrase("");
                }}
              >
                Cancel
              </button>
              <button
                className="btn danger"
                disabled={
                  deletingContact || !deletePhraseMatches(contactDeletePhrase)
                }
                onClick={() => void removeContact(contactToDelete)}
              >
                {deletingContact ? "Deleting..." : "Delete contact"}
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmBulkDelete && (
        <div
          className="category-confirm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-selected-title"
        >
          <div className="category-confirm-card">
            <div className="danger-icon">
              <Trash2 size={18} />
            </div>
            <h2 id="delete-selected-title">
              Delete {selectedVisible.length} selected contacts?
            </h2>
            <p>
              This permanently removes these CRM records and removes them from
              saved audiences.
            </p>
            <DeletePhraseInput
              value={bulkDeletePhrase}
              onChange={setBulkDeletePhrase}
              disabled={deletingContacts}
            />
            <div className="category-confirm-actions">
              <button
                className="btn secondary"
                disabled={deletingContacts}
                onClick={() => {
                  setConfirmBulkDelete(false);
                  setBulkDeletePhrase("");
                }}
              >
                Cancel
              </button>
              <button
                className="btn danger"
                disabled={
                  deletingContacts || !deletePhraseMatches(bulkDeletePhrase)
                }
                onClick={() => void removeSelectedContacts()}
              >
                {deletingContacts ? "Deleting..." : "Delete contacts"}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div
          className={`toast toast-${toast.kind}`}
          role={toast.kind === "error" ? "alert" : "status"}
          aria-live={toast.kind === "error" ? "assertive" : "polite"}
        >
          {toast.kind === "loading" ? (
            <LoaderCircle size={17} className="auth-spinner" />
          ) : toast.kind === "error" ? (
            <CircleX size={17} />
          ) : (
            <CircleCheck size={17} />
          )}
          <span>{toast.message}</span>
          {toast.kind !== "loading" && (
            <button
              className="toast-dismiss"
              aria-label="Dismiss notification"
              onClick={() => setToast(null)}
            >
              <X size={15} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
