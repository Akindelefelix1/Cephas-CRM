import { useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  ContactRound,
  FileText,
  LifeBuoy,
  Mail,
  MessageCircle,
  MessageSquareText,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import type { Page } from "../models";
import { PageHeading } from "../components/Shared";

type Guide = {
  title: string;
  group: string;
  description: string;
  steps: string[];
  note: string;
  troubleshooting: string[];
  icon: ReactNode;
  links?: { label: string; href: string }[];
};

const guides: Guide[] = [
  {
    title: "Manage contacts",
    group: "CONTACTS",
    description: "Create, import, search, update, merge, and export people in your CRM.",
    steps: [
      "Open Contacts. Choose Add contact to enter one person, or Import to upload a CSV or Excel file. Try a small import first if this is your first time using a file layout.",
      "Match file columns to the CRM fields in the import preview. First name and a valid email address are required. Review invalid rows and duplicate warnings before confirming the import.",
      "Open a contact to update their phone, organization, category, location, interests, tags, and channel consent. Save the record before leaving the form.",
      "Use search to find records. Select rows to export or delete them. Deleting a contact also removes it from saved audience memberships.",
      "To combine duplicates, open the contact you want to keep and choose Merge. Select the source record, review the combined fields and consent, then confirm. The source record is removed after a successful merge.",
    ],
    note: "Email, SMS, and WhatsApp consent are separate. A person subscribed to one channel is not automatically subscribed to another.",
    troubleshooting: ["An email was skipped: imports do not create a second contact with an email that already exists.", "A file field is missing: confirm that the first row contains column headings, then map required fields in the preview."],
    icon: <ContactRound size={18} />,
  },
  {
    title: "Build an audience",
    group: "AUDIENCES",
    description: "Save a hand-picked group or a rule-based segment for campaign targeting.",
    steps: [
      "Open Audiences and choose Create audience. Give it a clear name and, if useful, a description so others can understand its purpose.",
      "Choose Static group to add specific contacts, or Dynamic segment to define rules that match contact fields.",
      "For a dynamic segment, add rules using the available fields such as category, tags, location, interests, and consent. Review matching contacts before saving.",
      "For a static group, select saved contacts and review the member list before saving. You can add or remove members later from the audience details.",
      "When using an audience in a campaign, the CRM removes duplicate recipients and checks consent for the selected channel before sending.",
    ],
    note: "An audience match does not override consent. Eligibility is checked separately for Email, SMS, and WhatsApp.",
    troubleshooting: ["The audience is empty: check its rules and confirm matching contacts exist.", "A contact is not eligible: open that contact and review consent for the campaign's channel."],
    icon: <Users size={18} />,
  },
  {
    title: "Use and manage templates",
    group: "TEMPLATES",
    description: "Create, edit, organize, and reuse Email, SMS, and WhatsApp content.",
    steps: [
      "Open Templates and choose the Email, SMS, or WhatsApp tab. Search by name or content to find a template.",
      "Choose Use template to start a campaign with its content. Review the copied subject, message, and channel fields before saving the campaign.",
      "Choose Create template to make reusable content. Select a channel and enter a unique name and required content. Email templates also need a subject line.",
      "Open a template's three-dot menu to edit or delete it. Deleting a template removes that reusable template; campaigns already created from it remain separate.",
      "Sample templates can be edited or removed like other templates. Save edits and check the card to confirm the content is correct.",
    ],
    note: "A template stores content. It does not select campaign recipients, prove consent, or configure a delivery provider.",
    troubleshooting: ["Cannot save: check the name, required content, and displayed length limits.", "Template is missing: clear search and check the correct channel tab."],
    icon: <FileText size={18} />,
  },
  {
    title: "Create and send an email campaign",
    group: "EMAIL CAMPAIGNS",
    description: "Prepare content, verify recipients, configure Zoho, and send or schedule safely.",
    steps: [
      "Open Email campaigns and choose Start creating. Enter a campaign name, subject, message, and audience. You can start from a template.",
      "Review included and excluded audiences and individual exclusions. Confirm the sender, message links, and content. Contacts without Email consent are suppressed.",
      "Save a draft to return later. Use the campaign's three-dot action menu to edit, duplicate, submit for approval, send, or schedule when those actions are available for its status.",
      "Before a real send, configure Zoho Campaigns in Settings → Integrations, verify the sender in Zoho, and run Test connection. A content preview is not a delivered test email.",
      "After sending, review the campaign status. If it failed, choose View error details, fix the provider or content issue, then retry. Check whether Zoho accepted the campaign before retrying to avoid duplicate sends.",
    ],
    note: "Zoho Campaigns performs marketing email delivery. The connection check confirms OAuth and read access; it does not send a message or verify sender approval.",
    troubleshooting: ["OAuth is not configured: add Client ID, Client Secret, and Refresh Token to the CRM API hosting environment, then restart/redeploy the API.", "Sender rejected: verify the From address in Zoho Campaigns and inspect the full campaign error.", "No eligible recipients: check valid email addresses, audience rules, exclusions, and Email consent set to Subscribed."],
    icon: <Send size={18} />,
  },
  {
    title: "Connect Zoho Campaigns",
    group: "EMAIL SETUP",
    description: "Create OAuth credentials, exchange the short-lived code, configure the API, and test access.",
    steps: [
      "Sign in to the Zoho account that owns the correct Campaigns organization. In the Zoho API Console, create a Self Client. Copy its Client ID and Client Secret from the Client Secret tab.",
      "In Generate Code, paste this exact scope string on one line, with no extra spaces: ZohoCampaigns.campaign.ALL,ZohoCampaigns.contact.CREATE,ZohoCampaigns.contact.UPDATE. Select an expiry, describe the access, and choose Create. If prompted, select Zoho Campaigns and the correct portal/organization.",
      "Copy the generated code. In Postman create a POST request to https://accounts.zoho.com/oauth/v2/token (use your region's Accounts URL). Under Body → x-www-form-urlencoded set grant_type=authorization_code, client_id, client_secret, and code. Send it once before the code expires. The response should include refresh_token.",
      "In Render, open the cephas-crm-api service → Environment. Set ZOHO_CAMPAIGNS_CLIENT_ID, ZOHO_CAMPAIGNS_CLIENT_SECRET, ZOHO_CAMPAIGNS_REFRESH_TOKEN, and ZOHO_CAMPAIGNS_FROM_EMAIL. Keep all secrets in the backend environment; do not put them in frontend variables or the CRM browser.",
      "Set ZOHO_CAMPAIGNS_ACCOUNTS_URL and ZOHO_CAMPAIGNS_API_URL to matching data-center domains. US example: https://accounts.zoho.com and https://campaigns.zoho.com/api/v1.1. Save and allow Render to redeploy/restart the API.",
      "In Cephas CRM, open Settings → Integrations and choose Test connection. Success confirms OAuth credentials and Campaigns read access. Verify the sender address with Zoho before sending a real campaign.",
    ],
    note: "Zoho grant codes expire quickly and are single-use. Access tokens are refreshed by the backend. Optional environment values include ZOHO_CAMPAIGNS_FROM_NAME, ZOHO_CAMPAIGNS_TIMEZONE, and ZOHO_CAMPAIGNS_TOPIC_ID.",
    troubleshooting: ["Enter a valid scope: paste the exact scope string on one line, check spelling and case, and use the API Console for the Campaigns-owning account. The CRM guide uses separate contact CREATE and UPDATE scopes.", "invalid_code during exchange: generate a new code and exchange it immediately; do not reuse an exchanged code.", "invalid scope during Test connection: generate a new grant including campaign.ALL and replace the refresh token in Render.", "Connection succeeds but send fails: verify the sender is approved, the grant includes campaign/contact permissions, and the CRM API public URL is available."],
    links: [
      { label: "Zoho API Console", href: "https://api-console.zoho.com/" },
      { label: "Self Client code and token guide", href: "https://www.zoho.com/developer/oauth/self-client/authorization-code-flow.html" },
      { label: "Campaigns scopes", href: "https://www.zoho.com/campaigns/help/developers/access-token.html" },
      { label: "Zoho data center URLs", href: "https://www.zoho.com/campaigns/help/developers/data-centers.html" },
    ],
    icon: <Mail size={18} />,
  },
  {
    title: "Set up bulk SMS",
    group: "BULK SMS",
    description: "Configure Termii, check recipient eligibility, and review message parts and delivery results.",
    steps: [
      "Open Settings → Integrations and check the Termii status. The API needs TERMII_API_KEY and an approved TERMII_SENDER_ID in its hosting environment.",
      "In Termii, complete sender ID registration and use the exact approved sender ID. Keep the API key private in the backend environment, set the correct Termii API base URL, and redeploy the API.",
      "Open Bulk SMS → Start creating. Name the campaign, compose the message, and choose an audience. Check phone numbers and SMS consent before saving.",
      "Review the estimated message parts/cost. Long messages, Unicode characters, and some symbols can split a message into multiple SMS parts; final provider billing can differ from an estimate.",
      "Save as a draft, submit for approval if required, then send or schedule from the campaign action menu. Review status and delivery failures after processing.",
    ],
    note: "A phone number alone is not consent. The CRM checks SMS consent before sending. Try a small, authorized audience before a large campaign.",
    troubleshooting: ["Sender ID rejected: confirm Termii approved it and TERMII_SENDER_ID matches exactly.", "Recipient skipped: check for a valid phone number and SMS consent set to Subscribed.", "Authentication error: replace the Termii API key in the backend host and redeploy."],
    icon: <MessageSquareText size={18} />,
  },
  {
    title: "Set up WhatsApp campaigns",
    group: "WHATSAPP",
    description: "Connect Zoho CPaaS and prepare messages based on approved WhatsApp templates.",
    steps: [
      "Ask your Zoho CPaaS administrator for the WhatsApp API key, agent/sender details, and approved template name. Confirm the account can send outbound WhatsApp messages.",
      "Add ZOHO_WHATSAPP_API_KEY, ZOHO_WHATSAPP_AGENT_ID, and ZOHO_WHATSAPP_FROM to the CRM API environment. Keep the key on the backend and redeploy the API.",
      "In Templates, create or edit a WhatsApp template using the exact approved provider template name and required variable mappings.",
      "Open WhatsApp, create a campaign, choose an audience, enter the approved template details, map every required variable, and preview the message.",
      "Confirm WhatsApp consent and international phone numbers before sending. Review deliveries and refresh provider status when available.",
    ],
    note: "A CRM message does not replace provider approval. The template name, sender, locale, and variables must match the approved Zoho CPaaS configuration.",
    troubleshooting: ["Template rejected: compare its name and variable order with the Zoho-approved template.", "Contact skipped: check WhatsApp consent and phone number formatting.", "Provider not configured: verify required ZOHO_WHATSAPP_* values on the backend and redeploy."],
    icon: <MessageCircle size={18} />,
  },
  {
    title: "Schedule and manage campaigns",
    group: "SCHEDULED",
    description: "Schedule a campaign, review upcoming sends, and pause or cancel when needed.",
    steps: [
      "Prepare and save the campaign with its audience, content, consent, and provider configuration checked.",
      "Choose Schedule from the campaign action menu and select a future date and time. Confirm the timezone shown on the Scheduled page; schedule times display in West Africa Time (UTC+1).",
      "Open Scheduled and review upcoming campaigns in list or calendar view. Check the name, channel, send time, and status.",
      "Use campaign actions to pause or cancel an upcoming send. Confirm the status changes before leaving. Resume only after checking content and recipients again.",
    ],
    note: "Email schedules are submitted to Zoho Campaigns; other channels depend on their configured provider and the CRM scheduler. A schedule is not proof of delivery.",
    troubleshooting: ["Campaign not listed: confirm it was saved with a future send time, then refresh.", "Scheduling failed: read the full error, check credentials and sender approval, correct the issue, and retry."],
    icon: <CalendarDays size={18} />,
  },
  {
    title: "Read reports and analytics",
    group: "REPORTS",
    description: "Select a reporting period, interpret metrics, and export the data shown.",
    steps: [
      "Open Dashboard for a workspace snapshot or Reports for campaign and channel analysis. Choose the reporting period before interpreting totals.",
      "Sent, delivered, clicks, failures, and unsubscribes are different events. A delivery rate is available only when provider delivery data has been received.",
      "Use campaign activity to review saved campaigns and statuses. Failed rows open full error details in a modal.",
      "Choose Export CSV to download the report currently shown. Set the intended period and filters before exporting.",
    ],
    note: "Metrics marked Sample or Illustrative are examples, not live performance or billing data. Live reporting requires provider tracking/events to be connected.",
    troubleshooting: ["Report failed to load: use Retry; if it continues, check API authentication and service availability.", "Metric unavailable: the provider may not supply that event, or tracking may not be enabled."],
    icon: <BarChart3 size={18} />,
  },
  {
    title: "Review the audit log",
    group: "AUDIT LOG",
    description: "Search recorded activity, filter events, inspect timestamps, and export visible entries.",
    steps: [
      "Open Audit log. Recorded entries include the actor, action, details, event type, and time.",
      "Search by a person, activity, details, or event type. Use the event filter to narrow results; clear the search and filter to restore the full list.",
      "Use pagination to move through matching entries. The visible count can be smaller than the total matching count.",
      "Choose Export visible events to download the rows currently shown. Apply the search and event filter you want before exporting.",
    ],
    note: "The audit log records supported CRM actions; it does not record every browser action or provider-side event. Store exports in an access-controlled location.",
    troubleshooting: ["An action is missing: confirm it completed and that the feature records that event.", "No events found: clear the search and event filter, then retry."],
    icon: <ClipboardList size={18} />,
  },
  {
    title: "Manage settings and integrations",
    group: "SETTINGS",
    description: "Update workspace preferences, inspect provider configuration, and test Zoho access.",
    steps: [
      "Open Settings and select General, Users & roles, Consent & suppression, Security & privacy, or Integrations.",
      "In General, update the organization name, timezone preference, or sender label and choose Save settings. These profile preferences do not replace provider-side sender or schedule settings.",
      "In Integrations, review backend provider status. For Zoho, follow Connect Zoho Campaigns in this Help centre and test the connection after configuring Render.",
      "In Consent & suppression, review channel checks. Change a contact's consent only when you have a reliable record of their preference.",
      "In Security & privacy, record data rights requests and follow up using your organization's process. Sign out when using a shared device.",
    ],
    note: "Provider secrets are managed by an administrator in the backend host and intentionally are not displayed in the browser. Invitations and role-based team access are not available in the current account setup.",
    troubleshooting: ["Settings failed to load: choose Retry and confirm you are signed in.", "Provider is not configured: add required values to the backend environment, redeploy, then reload Settings."],
    icon: <Settings2 size={18} />,
  },
  {
    title: "Understand consent, privacy, and access",
    group: "SECURITY",
    description: "Protect contact preferences and understand current account and privacy controls.",
    steps: [
      "Before outreach, confirm the contact has appropriate consent for the specific channel. Email, SMS, and WhatsApp preferences are separate.",
      "Set a contact to Unsubscribed when they opt out. Do not mark a person Subscribed without valid permission.",
      "Use Settings → Security & privacy to record an access, correction, or deletion request. Verify the requester and complete it through your organization's privacy process.",
      "Use Sign out on a shared or public device. Authentication and multifactor controls are managed by the identity provider.",
    ],
    note: "Users & roles currently provides account access only. It does not provide invitations or team roles; a new sign-up receives a separate account.",
    troubleshooting: ["A campaign blocks a contact: review consent for the campaign's channel on the contact record.", "Need another person to access CRM data: do not share passwords; team membership is not currently available."],
    icon: <ShieldCheck size={18} />,
  },
];

export function HelpCentre({ onBack, setPage }: { onBack: () => void; setPage: (page: Page) => void }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState("");
  const visibleGuides = guides.filter((guide) =>
    `${guide.title} ${guide.group} ${guide.description} ${guide.steps.join(" ")} ${guide.note} ${guide.troubleshooting.join(" ")}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  const shortcuts: { label: string; description: string; page: Page; icon: ReactNode }[] = [
    { label: "Contacts", description: "Add or find a person", page: "Contacts", icon: <ContactRound size={18} /> },
    { label: "Audiences", description: "Explore your groups", page: "Audiences", icon: <Users size={18} /> },
    { label: "Templates", description: "Browse reusable content", page: "Templates", icon: <FileText size={18} /> },
    { label: "Campaigns", description: "Review email and SMS", page: "Email campaigns", icon: <Send size={18} /> },
  ];

  return (
    <div className="help-centre-page">
      <PageHeading eyebrow="CEPHAS PEOPLE SUPPORT" title="Help centre" desc="Step-by-step instructions for everyday CRM tasks, setup, and common errors." action={<button className="btn secondary" onClick={onBack}><ChevronLeft size={16} /> Back to dashboard</button>} />
      <section className="help-search-hero">
        <div className="help-hero-copy"><span><LifeBuoy size={15} /> CEPHAS SUPPORT</span><h2>How can we help?</h2><p>Search setup instructions, workflows, and troubleshooting advice.</p></div>
        <label className="help-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search a task or error message…" aria-label="Search help guides" />{search && <button type="button" onClick={() => setSearch("")} aria-label="Clear help search"><X size={16} /></button>}</label>
        <div className="help-hero-decoration"><span><CircleHelp size={25} /></span><i /><i /><i /></div>
      </section>
      <section className="help-shortcuts-section">
        <div className="help-section-heading"><div><p className="eyebrow">QUICK LINKS</p><h2>Jump into your workspace</h2></div><span>Choose a task to get started</span></div>
        <div className="help-shortcuts">{shortcuts.map((shortcut) => <button className="help-shortcut" key={shortcut.label} onClick={() => setPage(shortcut.page)}><span className="help-shortcut-icon">{shortcut.icon}</span><span><b>{shortcut.label}</b><small>{shortcut.description}</small></span><ArrowUpRight size={15} /></button>)}</div>
      </section>
      <section className="help-guides-section">
        <div className="help-section-heading"><div><p className="eyebrow">STEP-BY-STEP HELP</p><h2>Guides for using Cephas CRM</h2></div><span>{visibleGuides.length} {visibleGuides.length === 1 ? "guide" : "guides"}</span></div>
        {visibleGuides.length ? <div className="help-guides-grid">{visibleGuides.map((guide) => {
          const isOpen = expanded === guide.title;
          return <article className={`help-guide ${isOpen ? "expanded" : ""}`} key={guide.title}>
            <div className="help-guide-top"><span className="help-guide-icon">{guide.icon}</span><span className="help-guide-group">{guide.group}</span></div>
            <h3>{guide.title}</h3><p>{guide.description}</p>
            {isOpen && <div className="help-guide-content"><h4>Steps</h4><ol>{guide.steps.map((step, index) => <li key={index}>{step}</li>)}</ol><div className="help-guide-note"><b>Good to know</b><p>{guide.note}</p></div><div className="help-guide-troubleshooting"><h4>Common issues</h4><ul>{guide.troubleshooting.map((item) => <li key={item}>{item}</li>)}</ul></div>{guide.links && <div className="help-guide-links"><h4>Official Zoho resources</h4>{guide.links.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label}<ArrowUpRight size={12} /></a>)}</div>}</div>}
            <button className="help-guide-toggle" aria-expanded={isOpen} onClick={() => setExpanded(isOpen ? "" : guide.title)}>{isOpen ? "Close guide" : "Read step-by-step"}<ChevronRight size={15} /></button>
          </article>;
        })}</div> : <div className="help-no-results"><Search size={18} /><b>No guides found</b><span>Try a task name such as “templates”, “Zoho”, “send”, or “consent”.</span></div>}
      </section>
    </div>
  );
}
