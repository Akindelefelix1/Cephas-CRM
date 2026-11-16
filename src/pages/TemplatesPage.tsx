import { useState } from "react";
import {
  ArrowUpRight,
  FileText,
  Mail,
  MessageCircle,
  MessageSquareText,
  Plus,
} from "lucide-react";
import type { TemplateDraft } from "../models";
import { PageHeading } from "../components/Shared";

const templateSamples = [
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
export function TemplateLibrary({
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
