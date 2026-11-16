import { useState } from "react";
import {
  Activity,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Filter,
  LoaderCircle,
  ListFilter,
  Plus,
  Search,
  Send,
  SlidersHorizontal,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type { Contact, AudienceRecord, AudienceDraft } from "../models";
import { Badge, PageHeading } from "../components/Shared";
import { audienceRecordFromApi } from "../models";
import { DeletePhraseInput, deletePhraseMatches } from "../components/Shared";

export function AudienceProfile({
  audience,
  contacts,
  onBack,
  openCampaign,
  onEdit,
  onDelete,
  onAddMembers,
  onRemoveMember,
}: {
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
  const [audienceDeletePhrase, setAudienceDeletePhrase] = useState("");
  const [audienceDeleteBusy, setAudienceDeleteBusy] = useState(false);
  const [audienceDeleteError, setAudienceDeleteError] = useState("");
  const [memberToRemove, setMemberToRemove] = useState<Contact | null>(null);
  const [memberDeletePhrase, setMemberDeletePhrase] = useState("");
  const [memberDeleteBusy, setMemberDeleteBusy] = useState(false);
  const [memberDeleteError, setMemberDeleteError] = useState("");
  const memberIds = new Set(
    audience.members.map((member) => member.id).filter(Boolean),
  );
  const availableContacts = contacts.filter(
    (contact) => contact.id && !memberIds.has(contact.id),
  );
  const confirmAudienceRemoval = async () => {
    if (!deletePhraseMatches(audienceDeletePhrase) || audienceDeleteBusy)
      return;
    setAudienceDeleteBusy(true);
    setAudienceDeleteError("");
    try {
      await onDelete();
      setConfirmDelete(false);
      setAudienceDeletePhrase("");
    } catch (error) {
      setAudienceDeleteError(
        error instanceof Error ? error.message : "Could not delete audience",
      );
    } finally {
      setAudienceDeleteBusy(false);
    }
  };
  const confirmMemberRemoval = async () => {
    if (
      !memberToRemove?.id ||
      !deletePhraseMatches(memberDeletePhrase) ||
      memberDeleteBusy
    )
      return;
    setMemberDeleteBusy(true);
    setMemberDeleteError("");
    try {
      await onRemoveMember(memberToRemove.id);
      setMemberToRemove(null);
      setMemberDeletePhrase("");
    } catch (error) {
      setMemberDeleteError(
        error instanceof Error
          ? error.message
          : "Could not remove audience member",
      );
    } finally {
      setMemberDeleteBusy(false);
    }
  };
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
      <PageHeading
        eyebrow="AUDIENCE DETAILS"
        title={audience.name}
        desc="Review this audience’s definition and membership before using it."
        action={
          <>
            <button className="btn secondary" onClick={onBack}>
              <ChevronLeft size={16} /> Back to audiences
            </button>
            <button className="btn secondary" onClick={onEdit}>
              <SlidersHorizontal size={15} /> Edit audience
            </button>
            <button
              className="btn danger-quiet"
              onClick={() => {
                setAudienceDeletePhrase("");
                setAudienceDeleteError("");
                setConfirmDelete(true);
              }}
            >
              <Trash2 size={15} /> Delete
            </button>
            <button
              className="btn primary"
              onClick={() => openCampaign(audience.name)}
            >
              <Send size={15} /> Use in campaign
            </button>
          </>
        }
      />
      <section className="audience-profile-hero">
        <div className={`audience-card-icon ${audience.tone}`}>
          <Users size={21} />
        </div>
        <div className="audience-profile-copy">
          <div className="contact-hero-name">
            <h2>{audience.name}</h2>
            <Badge
              tone={audience.type === "Dynamic segment" ? "Dynamic" : "neutral"}
            >
              {audience.type}
            </Badge>
          </div>
          <p>{audience.description || "No description provided."}</p>
          <small>Last updated · {audience.updated}</small>
        </div>
        <div className="audience-reach">
          <small>
            {audience.type === "Static group"
              ? "Saved members"
              : "Current matching contacts"}
          </small>
          <strong>{audience.count}</strong>
          <span>contacts</span>
        </div>
      </section>
      <div className="audience-profile-grid">
        <section className="panel">
          <div className="panel-title">
            <div>
              <h3>Audience definition</h3>
              <p>{audience.type} criteria</p>
            </div>
            <Filter size={18} />
          </div>
          {audience.rules.length ? (
            <div className="audience-rules-list">
              {audience.rules.map((rule, index) => (
                <div className="audience-rule" key={`${rule.field}-${index}`}>
                  <span>{rule.field}</span>
                  <Badge>{rule.operator}</Badge>
                  <b>{rule.value}</b>
                </div>
              ))}
            </div>
          ) : (
            <div className="audience-definition-copy">
              <div className="audience-rule-icon">
                <ListFilter size={16} />
              </div>
              <p>{audience.description || "No rules are saved."}</p>
              <small>
                {audience.type === "Dynamic segment"
                  ? "Edit this audience to add matching rules."
                  : "Static audiences use saved contact membership."}
              </small>
            </div>
          )}
        </section>
        <section className="panel audience-members-panel">
          <div className="panel-title">
            <div>
              <h3>Members</h3>
              <p>
                {audience.type === "Static group"
                  ? "Contacts saved in this group"
                  : "Contacts currently matching these rules"}
              </p>
            </div>
            {audience.type === "Static group" && (
              <button
                className="btn secondary"
                onClick={() => setAddingMembers((value) => !value)}
              >
                <Plus size={15} /> Add contacts
              </button>
            )}
          </div>
          {addingMembers && audience.type === "Static group" && (
            <div className="audience-add-members">
              {availableContacts.length ? (
                availableContacts.map((contact) => (
                  <label key={contact.id}>
                    <input
                      type="checkbox"
                      checked={Boolean(
                        contact.id && selectedIds.includes(contact.id),
                      )}
                      onChange={() =>
                        contact.id &&
                        setSelectedIds((current) =>
                          current.includes(contact.id!)
                            ? current.filter((id) => id !== contact.id)
                            : [...current, contact.id!],
                        )
                      }
                    />
                    <span>
                      <b>{contact.name}</b>
                      <small>{contact.email}</small>
                    </span>
                  </label>
                ))
              ) : (
                <p>
                  {contacts.length
                    ? "All available contacts are already in this group."
                    : "Add contacts to the CRM before building audience membership."}
                </p>
              )}
              <div className="audience-add-actions">
                <button
                  className="btn secondary"
                  onClick={() => {
                    setAddingMembers(false);
                    setSelectedIds([]);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn primary"
                  disabled={!selectedIds.length || busy}
                  onClick={() => void saveMembers()}
                >
                  {busy ? "Saving…" : `Add ${selectedIds.length || "selected"}`}
                </button>
              </div>
            </div>
          )}
          {audience.members.length ? (
            <div className="audience-member-list">
              {audience.members.map((member) => (
                <div
                  className="audience-member"
                  key={member.id ?? member.email}
                >
                  <div className={`avatar ${member.color}`}>
                    {member.initials}
                  </div>
                  <span>
                    <b>{member.name}</b>
                    <small>{member.email}</small>
                  </span>
                  <Badge>{member.category}</Badge>
                  {audience.type === "Static group" && member.id && (
                    <button
                      className="icon-btn"
                      aria-label={`Remove ${member.name} from audience`}
                      disabled={busy || memberDeleteBusy}
                      onClick={() => {
                        setMemberToRemove(member);
                        setMemberDeletePhrase("");
                        setMemberDeleteError("");
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="profile-empty-activity audience-empty-members">
              <div>
                <Users size={18} />
              </div>
              <b>No contacts in this audience</b>
              <p>
                {audience.type === "Dynamic segment"
                  ? "No current contacts match these rules. Edit the audience to adjust its criteria."
                  : "Add contacts to this static group to build its membership."}
              </p>
            </div>
          )}
        </section>
      </div>
      {confirmDelete && (
        <div
          className="category-confirm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-audience-title"
        >
          <div className="category-confirm-card">
            <div className="danger-icon">
              <Trash2 size={17} />
            </div>
            <h2 id="delete-audience-title">Delete “{audience.name}”?</h2>
            <p>
              This permanently deletes the audience and its saved membership.
              Contact records remain in your CRM.
            </p>
            <DeletePhraseInput
              value={audienceDeletePhrase}
              onChange={setAudienceDeletePhrase}
              disabled={audienceDeleteBusy}
            />
            {audienceDeleteError && (
              <p className="validation-message" role="alert">
                {audienceDeleteError}
              </p>
            )}
            <div className="category-confirm-actions">
              <button
                className="btn secondary"
                disabled={audienceDeleteBusy}
                onClick={() => {
                  setConfirmDelete(false);
                  setAudienceDeletePhrase("");
                }}
              >
                Keep audience
              </button>
              <button
                className="btn danger"
                disabled={
                  audienceDeleteBusy ||
                  !deletePhraseMatches(audienceDeletePhrase)
                }
                onClick={() => void confirmAudienceRemoval()}
              >
                {audienceDeleteBusy ? "Deleting..." : "Delete audience"}
              </button>
            </div>
          </div>
        </div>
      )}
      {memberToRemove && (
        <div
          className="category-confirm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="remove-audience-member-title"
        >
          <div className="category-confirm-card">
            <div className="danger-icon">
              <X size={17} />
            </div>
            <h2 id="remove-audience-member-title">
              Remove {memberToRemove.name}?
            </h2>
            <p>
              This removes the contact from this static audience. The contact
              record will remain in your CRM.
            </p>
            <DeletePhraseInput
              value={memberDeletePhrase}
              onChange={setMemberDeletePhrase}
              disabled={memberDeleteBusy}
            />
            {memberDeleteError && (
              <p className="validation-message" role="alert">
                {memberDeleteError}
              </p>
            )}
            <div className="category-confirm-actions">
              <button
                className="btn secondary"
                disabled={memberDeleteBusy}
                onClick={() => {
                  setMemberToRemove(null);
                  setMemberDeletePhrase("");
                }}
              >
                Cancel
              </button>
              <button
                className="btn danger"
                disabled={
                  memberDeleteBusy || !deletePhraseMatches(memberDeletePhrase)
                }
                onClick={() => void confirmMemberRemoval()}
              >
                {memberDeleteBusy ? "Removing..." : "Remove contact"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export function AudiencesPreview({
  drafts,
  loading,
  error,
  retry,
  setModal,
  onView,
  openCampaign,
}: {
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
  const shown = drafts.filter(
    (audience) =>
      (kind === "All audiences" ||
        (kind === "Dynamic segments"
          ? audience.type === "Dynamic segment"
          : audience.type === "Static group")) &&
      `${audience.name} ${audience.description}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="KNOW YOUR AUDIENCE"
        title="Audiences"
        desc="Build meaningful groups and reach the right people every time."
        action={
          <button className="btn primary" onClick={() => setModal("segment")}>
            <Plus size={17} /> Create audience
          </button>
        }
      />
      <div className="audience-highlight">
        <div className="audience-highlight-icon">
          <Users size={23} />
        </div>
        <div>
          <b>Better targeting, stronger connections.</b>
          <p>
            Create dynamic segments that update from contact records or maintain
            static groups by hand.
          </p>
        </div>
        <span className="text-link">Static group · dynamic segment</span>
      </div>
      <div className="section-row audience-section">
        <div>
          <h2 className="section-title">
            Audiences <span className="light-count">{drafts.length}</span>
          </h2>
          <p className="section-subtitle">
            Saved groups and dynamic segments from your CRM.
          </p>
        </div>
        <div className="audience-list-controls">
          <div className="search-input">
            <Search size={15} />
            <input
              aria-label="Search audiences"
              placeholder="Search audiences"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <select
            className="period-select"
            aria-label="Filter audience type"
            value={kind}
            onChange={(event) => setKind(event.target.value)}
          >
            <option>All audiences</option>
            <option>Dynamic segments</option>
            <option>Static groups</option>
          </select>
        </div>
      </div>
      <div className="audience-grid">
        {loading ? (
          <div className="empty-state">
            <LoaderCircle size={20} className="auth-spinner" />
            <b>Loading audiences</b>
            <span>Fetching saved groups and segments from the API.</span>
          </div>
        ) : error ? (
          <div className="empty-state" role="alert">
            <Activity size={20} />
            <b>Audiences could not be loaded</b>
            <span>{error}</span>
            <button className="btn secondary" onClick={retry}>
              Retry
            </button>
          </div>
        ) : shown.length ? (
          shown.map((audience, index) => {
            const record = audienceRecordFromApi(
              {
                id: audience.id,
                name: audience.name,
                type:
                  audience.type === "Dynamic segment" ? "dynamic" : "static",
                description: audience.description,
                rules: audience.rules,
                memberCount: audience.memberCount ?? audience.members.length,
                createdAt: audience.updatedAt,
                updatedAt: audience.updatedAt,
              },
              audience.members,
            );
            return (
              <article className="panel audience-card" key={audience.id}>
                <div className="audience-card-top">
                  <div
                    className={`audience-card-icon ${["violet", "orange", "blue", "green", "pink", "peach"][index % 6]}`}
                  >
                    <Users size={18} />
                  </div>
                  <Badge
                    tone={
                      audience.type === "Dynamic segment"
                        ? "Dynamic"
                        : "neutral"
                    }
                  >
                    {audience.type}
                  </Badge>
                </div>
                <h3>{audience.name}</h3>
                <p>
                  {audience.description ||
                    (audience.type === "Static group"
                      ? "A manually maintained group of contacts."
                      : `${audience.rules.length} saved matching conditions.`)}
                </p>
                <div className="audience-card-bottom">
                  <span>
                    <b>{audience.memberCount ?? audience.members.length}</b>{" "}
                    contacts
                  </span>
                  <small>
                    Updated {new Date(audience.updatedAt).toLocaleDateString()}
                  </small>
                </div>
                <div className="audience-card-actions">
                  <button onClick={() => onView(record)}>
                    View audience <ArrowUpRight size={14} />
                  </button>
                  <button onClick={() => openCampaign(audience.name)}>
                    Use in campaign <ChevronRight size={14} />
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <div className="empty-state">
            <Users size={20} />
            <b>
              {drafts.length
                ? "No audiences match this search"
                : "No audiences yet"}
            </b>
            <span>
              {drafts.length
                ? "Change the search or audience type filter."
                : "Create a static group or dynamic segment to get started."}
            </span>
            {!drafts.length && (
              <button
                className="btn primary"
                onClick={() => setModal("segment")}
              >
                <Plus size={15} /> Create audience
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
