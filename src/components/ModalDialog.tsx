import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleHelp,
  Filter,
  GripVertical,
  Image as ImageIcon,
  LoaderCircle,
  MessageCircle,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { crmApi } from "../api";
import type {
  Contact,
  EmailBlock,
  FilterRule,
  AudienceRecord,
  TemplateDraft,
} from "../models";
import { getSmsEstimate, serializeEmailBlocks } from "../utils/campaignContent";

export function ModalDialog({
  kind,
  categories,
  close,
  saveContact,
  initialContact,
  campaignNames,
  campaignEditId,
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
  saveContact: (contact: Contact) => Promise<void>;
  initialContact: Contact | null;
  campaignNames: string[];
  campaignEditId: string | null;
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
    campaignId?: string | null,
  ) => Promise<void>;
  saveAudience: (
    name: string,
    type: "Dynamic segment" | "Static group",
    rules: FilterRule[],
    members: Contact[],
    audienceId?: string,
    description?: string,
  ) => Promise<void>;
  initialAudienceRecord: AudienceRecord | null;
  initialMembers: Contact[];
  contacts: Contact[];
  saveTemplate: (template: TemplateDraft) => void;
  importContacts: (file: File) => Promise<void>;
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
      initialAudienceRecord?.name ??
        (initialTemplate ? `${initialTemplate.name} campaign` : ""),
    ),
    [audienceDescription, setAudienceDescription] = useState(
      initialAudienceRecord?.description ?? "",
    ),
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
    [sendingTest, setSendingTest] = useState(false),
    [senderId, setSenderId] = useState(""),
    [objective, setObjective] = useState(initialTemplate?.objective ?? ""),
    [segmentType, setSegmentType] = useState<
      "Dynamic segment" | "Static group"
    >(
      initialAudienceRecord?.type ??
        (initialMembers.length > 0 ? "Static group" : "Dynamic segment"),
    ),
    [templateChannel, setTemplateChannel] = useState<
      "Email" | "SMS" | "WhatsApp"
    >(initialTemplate?.channel ?? "Email"),
    [rules, setRules] = useState<FilterRule[]>(
      initialAudienceRecord?.rules.length
        ? initialAudienceRecord.rules
        : [{ field: "Category", operator: "is", value: "" }],
    ),
    [validation, setValidation] = useState(""),
    [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!initialAudienceRecord) return;
    setCampaignName(initialAudienceRecord.name);
    setAudienceDescription(initialAudienceRecord.description);
    setSegmentType(initialAudienceRecord.type);
    setRules(
      initialAudienceRecord.rules.length
        ? initialAudienceRecord.rules
        : [{ field: "Category", operator: "is", value: "" }],
    );
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
            ? kind === "edit-audience"
              ? "Edit audience"
              : "Create an audience"
            : kind === "template"
              ? "Create a template"
              : kind === "sms"
                ? "Create an SMS campaign"
                : kind === "whatsapp"
                  ? "Create a WhatsApp campaign"
                  : campaignEditId
                    ? "Edit email campaign"
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
  const submit = async () => {
    if (saving) return;
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
      setSaving(true);
      try {
        await saveContact({
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
      } catch (error) {
        setValidation(
          error instanceof Error
            ? error.message
            : "Could not save this contact.",
        );
      } finally {
        setSaving(false);
      }
      return;
    }
    if (kind === "import") {
      if (file) {
        setSaving(true);
        try {
          await importContacts(file);
        } catch (error) {
          setValidation(
            error instanceof Error
              ? error.message
              : "Could not import this file.",
          );
        } finally {
          setSaving(false);
        }
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
      if (
        kind === "email" &&
        emailBlocks.some(
          (block) =>
            block.type === "image" && !/^https:\/\//i.test(block.content),
        )
      ) {
        setValidation("Each image needs a publicly reachable HTTPS URL.");
        return;
      }
      if (kind === "email" && attachmentNames.length) {
        setValidation(
          "Remove unused template attachments or add a public HTTPS link block for your document. Attachments aren’t sent by this integration.",
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
      setSaving(true);
      try {
        await saveDraft(
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
          campaignEditId,
        );
      } catch (error) {
        setValidation(
          error instanceof Error
            ? error.message
            : "Could not save the campaign.",
        );
      } finally {
        setSaving(false);
      }
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
            item.name.toLowerCase() !==
              initialAudienceRecord?.name.toLowerCase(),
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
      setSaving(true);
      try {
        await saveAudience(
          campaignName.trim(),
          segmentType,
          segmentType === "Dynamic segment" ? rules : [],
          initialMembers,
          initialAudienceRecord?.id,
          audienceDescription,
        );
      } catch (error) {
        setValidation(
          error instanceof Error
            ? error.message
            : "Could not save this audience.",
        );
      } finally {
        setSaving(false);
      }
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
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) close();
      }}
    >
      <div
        className={`modal ${kind === "email" ? "modal-campaign-builder" : ""}`}
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
            disabled={saving}
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
            {(kind === "segment" || kind === "edit-audience") && (
              <label className="form-label">
                Description
                <textarea
                  rows={2}
                  maxLength={500}
                  value={audienceDescription}
                  onChange={(event) =>
                    setAudienceDescription(event.target.value)
                  }
                  placeholder="Describe who belongs in this audience."
                />
                <small className="count-hint">
                  {audienceDescription.length}/500
                </small>
              </label>
            )}
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
                  <span className="segment-type-label">
                    Segment type
                    <span
                      className="segment-type-help"
                      tabIndex={0}
                      role="img"
                      aria-label="What does segment type mean?"
                    >
                      <CircleHelp size={14} aria-hidden="true" />
                      <span className="segment-type-tooltip" role="tooltip">
                        Dynamic segments automatically include contacts that
                        match your rules. Static groups contain contacts you add
                        or remove manually.
                      </span>
                    </span>
                  </span>
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
                    <p className="filter-builder-help">
                      Each condition filters your contacts. Add more conditions
                      to narrow the group; a contact must match every condition.
                      For example:
                    </p>
                    <ul className="filter-builder-examples">
                      <li>
                        <code>Category is Prospect</code>
                        <span>Contacts in the Prospect category.</span>
                      </li>
                      <li>
                        <code>Location contains Lagos</code>
                        <span>Contacts whose location includes “Lagos”.</span>
                      </li>
                      <li>
                        <code>Status is Subscribed</code>
                        <span>Contacts subscribed to email.</span>
                      </li>
                      <li>
                        <code>Tag is not Customer</code>
                        <span>Contacts without the Customer tag.</span>
                      </li>
                    </ul>
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
                      These contacts will be saved as members of this static
                      audience.
                    </p>
                  </div>
                ) : (
                  <p className="modal-note">
                    Save the static group, then add members from its audience
                    profile.
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
                        Sharing files
                        <small>
                          Zoho Campaigns needs hosted content. Add an Image
                          block with a public HTTPS image URL, or a Link block
                          for a document. File attachments aren’t sent by this
                          integration.
                        </small>
                        {attachmentNames.length > 0 && (
                          <span className="attachment-list">
                            Unused template files: {attachmentNames.join(" · ")}{" "}
                            <button
                              type="button"
                              className="text-link"
                              onClick={() => setAttachmentNames([])}
                            >
                              Clear
                            </button>
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
                              <label className="form-label">
                                Public image URL
                                <input
                                  type="url"
                                  value={block.content}
                                  placeholder="https://example.com/image.png"
                                  onChange={(event) =>
                                    updateEmailBlock(block.id, {
                                      content: event.target.value,
                                    })
                                  }
                                />
                                <small>
                                  The image must be publicly reachable over
                                  HTTPS so Zoho Campaigns can fetch it.
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
                          disabled={sendingTest || saving}
                          onClick={async () => {
                            if (!/^\S+@\S+\.\S+$/.test(testEmail)) {
                              setValidation(
                                "Enter a valid address for the test email.",
                              );
                              return;
                            }
                            setValidation("");
                            setSendingTest(true);
                            try {
                              await crmApi.sendCampaignTest(
                                testEmail,
                                subject,
                                emailBlocks,
                              );
                              recordAudit(
                                "Sent campaign test email",
                                `${campaignName} · ${testEmail}`,
                                "Campaign test email",
                              );
                              notify(`Test email sent to ${testEmail}`);
                            } catch (error) {
                              setValidation(
                                error instanceof Error
                                  ? error.message
                                  : "Could not send the test email.",
                              );
                            } finally {
                              setSendingTest(false);
                            }
                          }}
                        >
                          {sendingTest ? "Sending test..." : "Send test"}
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
                      Scheduled campaigns are delivered by Zoho Campaigns when
                      this time is reached.
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
          <button className="btn secondary" disabled={saving} onClick={close}>
            Cancel
          </button>
          <button
            className="btn primary"
            disabled={saving}
            onClick={() => void submit()}
          >
            {saving && <LoaderCircle size={15} className="auth-spinner" />}
            {saving
              ? kind === "import"
                ? "Importing contacts..."
                : kind === "segment" || kind === "edit-audience"
                  ? "Saving audience..."
                  : "Saving contact..."
              : kind === "add"
                ? "Add contact"
                : kind === "import"
                  ? "Import contacts"
                  : kind === "segment" || kind === "edit-audience"
                    ? kind === "edit-audience"
                      ? "Save changes"
                      : "Save audience"
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
