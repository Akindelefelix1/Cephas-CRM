import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  FileText,
  Mail,
  MessageCircle,
  MessageSquareText,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import type { TemplateDraft } from "../models";
import { PageHeading } from "../components/Shared";

const filters = ["All templates", "Email", "SMS", "WhatsApp", "My templates"];

export function TemplateLibrary({
  setModal,
  drafts,
  useTemplate,
  editTemplate,
  deleteTemplate,
  loading,
  error,
  reload,
}: {
  setModal: (s: string) => void;
  drafts: TemplateDraft[];
  useTemplate: (template: TemplateDraft) => void;
  editTemplate: (template: TemplateDraft) => void;
  deleteTemplate: (template: TemplateDraft) => Promise<void>;
  loading: boolean;
  error: string;
  reload: () => void;
}) {
  const [filter, setFilter] = useState("All templates");
  const [deleting, setDeleting] = useState<TemplateDraft | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [busy, setBusy] = useState(false);
  const shown = useMemo(() => drafts.filter((template) => {
    if (filter === "My templates") return !template.isDefault;
    if (filter === "All templates") return true;
    return template.channel === filter;
  }), [drafts, filter]);
  const countFor = (value: string) => value === "All templates"
    ? drafts.length
    : value === "My templates"
      ? drafts.filter((template) => !template.isDefault).length
      : drafts.filter((template) => template.channel === value).length;

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    setDeleteError("");
    try {
      await deleteTemplate(deleting);
      setDeleting(null);
    } catch (cause) {
      setDeleteError(cause instanceof Error ? cause.message : "Could not delete this template.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeading
        eyebrow="MAKE IT YOURS · TEMPLATE LIBRARY"
        title="Templates"
        desc="Create reusable email, SMS, and WhatsApp content for your campaigns."
        action={
          <button className="btn primary" onClick={() => setModal("template")}>
            <Plus size={17} /> Create template
          </button>
        }
      />
      <div className="template-tabs">
        {filters.map((value) => (
          <button key={value} className={`tab ${filter === value ? "active" : ""}`} onClick={() => setFilter(value)}>
            {value}<span>{countFor(value)}</span>
          </button>
        ))}
      </div>
      {loading ? (
        <div className="empty-state" role="status"><span>Loading templates…</span></div>
      ) : error ? (
        <div className="empty-state" role="alert">
          <FileText size={20} /><b>Could not load templates</b><span>{error}</span>
          <button className="btn secondary" onClick={reload}><RefreshCw size={15} /> Retry</button>
        </div>
      ) : shown.length ? (
        <div className="template-grid">
          {shown.map((template, index) => {
            const tone = ["violet", "orange", "blue", "green", "pink", "peach"][index % 6];
            const ChannelIcon = template.channel === "WhatsApp" ? MessageCircle : template.channel === "SMS" ? MessageSquareText : Mail;
            return (
              <article className="panel template-card" key={template.id ?? template.name}>
                <div className={`template-preview ${tone}`}>
                  <div className="preview-top">
                    <div className="preview-brand"><span>C</span> cephas</div>
                    <div className="template-card-actions">
                      <button aria-label={`Edit ${template.name}`} title="Edit template" onClick={() => editTemplate(template)}><Pencil size={15} /></button>
                      <button aria-label={`Delete ${template.name}`} title="Delete template" onClick={() => { setDeleteError(""); setDeleting(template); }}><Trash2 size={15} /></button>
                    </div>
                  </div>
                  <div className="preview-content">
                    <div className={`preview-art art-${(index % 7) + 1}`}><ChannelIcon size={25} /></div>
                    <div className="preview-line wide" /><div className="preview-line medium" /><div className="preview-line short" />
                    <span className="preview-cta">{template.channel === "Email" ? "Read more" : "Get started"}</span>
                  </div>
                  <span className="preview-tag">{template.channel}</span>
                </div>
                <div className="template-card-meta">
                  <div><h3>{template.name}</h3><p>{template.objective || template.body.replace(/\s+/g, " ").slice(0, 90)}</p></div>
                </div>
                <div className="template-card-foot">
                  <small>{template.useCount ?? 0} uses · {template.isDefault ? "Starter" : "My template"}</small>
                  <button onClick={() => useTemplate(template)}>Use template <ArrowUpRight size={14} /></button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <FileText size={20} /><b>{filter === "My templates" ? "No templates created yet" : "No templates in this filter"}</b>
          <span>Create a reusable template and it will appear here.</span>
          {filter !== "My templates" && <button className="btn secondary" onClick={() => setFilter("All templates")}>Show all templates</button>}
        </div>
      )}
      {deleting && (
        <div className="category-confirm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setDeleting(null); }}>
          <section className="category-confirm-card" role="alertdialog" aria-modal="true" aria-labelledby="template-delete-title">
            <h2 id="template-delete-title">Delete “{deleting.name}”?</h2>
            <p>This template will be permanently removed. Campaigns already created from it will not be affected.</p>
            {deleteError && <p className="form-error" role="alert">{deleteError}</p>}
            <div className="category-confirm-actions">
              <button className="btn secondary" disabled={busy} onClick={() => setDeleting(null)}>Cancel</button>
              <button className="btn danger" disabled={busy} onClick={() => void confirmDelete()}>{busy ? "Deleting…" : "Delete template"}</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
