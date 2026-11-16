import { useState } from "react";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronLeft,
  Clock3,
  ContactRound,
  LoaderCircle,
  Mail,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import type { Contact, AuditEvent } from "../models";
import { Badge, PageHeading } from "../components/Shared";
import { crmApi } from "../api";

export function ContactProfile({
  contact,
  activity,
  onBack,
  notify,
  onEmailSent,
  onEdit,
  onDelete,
  onStartCampaign,
}: {
  contact: Contact;
  activity: AuditEvent[];
  onBack: () => void;
  notify: (message: string) => void;
  onEmailSent: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStartCampaign: () => void;
}) {
  const [emailComposerOpen, setEmailComposerOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("Hello {{first_name}}");
  const [emailBody, setEmailBody] = useState(
    "Hi {{first_name}},\n\nI wanted to follow up with you.\n\nBest,\nCephas CRM",
  );
  const [emailSending, setEmailSending] = useState(false);
  const [emailError, setEmailError] = useState("");
  const personalize = (template: string) => {
    const [firstName = "", ...rest] = contact.name.split(/\s+/);
    const values: Record<string, string> = {
      first_name: firstName,
      last_name: rest.join(" "),
      name: contact.name,
      full_name: contact.name,
      email: contact.email,
      organization: contact.organization ?? "",
      location: contact.location === "Not provided" ? "" : contact.location,
    };
    return template.replace(
      /\{\{\s*([a-z_]+)\s*\}\}/gi,
      (match, key: string) =>
        Object.hasOwn(values, key.toLowerCase())
          ? values[key.toLowerCase()]
          : match,
    );
  };
  const sendPersonalEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!contact.id) {
      setEmailError("This contact is not linked to a saved CRM record.");
      return;
    }
    if (contact.status !== "Subscribed") {
      setEmailError(
        "Email consent is not subscribed. Update the contact’s consent before sending.",
      );
      return;
    }
    setEmailSending(true);
    setEmailError("");
    try {
      await crmApi.sendContactEmail(contact.id, {
        subject: emailSubject,
        body: emailBody,
      });
      onEmailSent();
      setEmailComposerOpen(false);
      notify(`Email sent to ${contact.email}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not send email";
      setEmailError(message);
      notify(`Could not send email: ${message}`);
    } finally {
      setEmailSending(false);
    }
  };
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
        <button
          className="btn secondary profile-email"
          type="button"
          onClick={() => {
            setEmailError("");
            setEmailComposerOpen(true);
          }}
        >
          <Mail size={15} /> Email contact
        </button>
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
      {emailComposerOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !emailSending)
              setEmailComposerOpen(false);
          }}
        >
          <form
            className="modal contact-email-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-email-title"
            onSubmit={sendPersonalEmail}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <small className="modal-eyebrow">PERSONAL EMAIL</small>
                <h2 id="contact-email-title">
                  Send an email to {contact.name}
                </h2>
              </div>
              <button
                className="icon-btn"
                type="button"
                aria-label="Close email composer"
                disabled={emailSending}
                onClick={() => setEmailComposerOpen(false)}
              >
                <X size={17} />
              </button>
            </div>
            <div className="modal-fields">
              <div className="email-recipient-lock">
                <span>To</span>
                <b>{contact.email}</b>
                <small>Recipient is locked to this contact.</small>
              </div>
              {contact.status !== "Subscribed" && (
                <p className="email-send-warning" role="alert">
                  This contact is {contact.status.toLowerCase()} for email.
                  Update email consent before sending.
                </p>
              )}
              {!contact.id && (
                <p className="email-send-warning" role="alert">
                  This contact is not linked to a saved CRM record, so it cannot
                  be sent through Zoho.
                </p>
              )}
              <label className="form-label">
                Subject
                <input
                  value={emailSubject}
                  onChange={(event) => setEmailSubject(event.target.value)}
                  maxLength={200}
                  required
                />
              </label>
              <label className="form-label">
                Message
                <textarea
                  className="contact-email-body"
                  value={emailBody}
                  onChange={(event) => setEmailBody(event.target.value)}
                  maxLength={10000}
                  required
                />
              </label>
              <p className="personalization-hint">
                Personalize with <code>{"{{first_name}}"}</code>,{" "}
                <code>{"{{last_name}}"}</code>, <code>{"{{name}}"}</code>,{" "}
                <code>{"{{email}}"}</code>, <code>{"{{organization}}"}</code>,
                or <code>{"{{location}}"}</code>.
              </p>
              <div className="personalization-preview">
                <b>Preview for {contact.name}</b>
                <strong>
                  {personalize(emailSubject) || "Subject preview"}
                </strong>
                <p>
                  {personalize(emailBody) ||
                    "Your message preview will appear here."}
                </p>
              </div>
              {emailError && (
                <p className="validation-message" role="alert">
                  {emailError}
                </p>
              )}
            </div>
            <div className="modal-foot">
              <button
                className="btn secondary"
                type="button"
                disabled={emailSending}
                onClick={() => setEmailComposerOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn primary"
                type="submit"
                disabled={
                  emailSending ||
                  !contact.id ||
                  contact.status !== "Subscribed" ||
                  !emailSubject.trim() ||
                  !emailBody.trim()
                }
              >
                {emailSending ? (
                  <LoaderCircle size={15} className="auth-spinner" />
                ) : (
                  <Send size={15} />
                )}
                {emailSending ? "Sending..." : "Send email"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
