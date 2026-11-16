import { useState } from "react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ContactRound,
  FileText,
  LifeBuoy,
  Search,
  Send,
  ShieldCheck,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import type { Page } from "../models";
import { PageHeading } from "../components/Shared";

export function HelpCentre({
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
