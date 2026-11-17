import { useEffect, useState } from "react";
import {
  Blocks,
  LogOut,
  Mail,
  MessageCircle,
  MessageSquareText,
  Plus,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { TeamRole, TeamUser, PermissionId } from "../models";
import { Badge, PageHeading } from "../components/Shared";
import { crmApi } from "../api";
import {
  loadTeamUsers,
  permissionCatalog,
  rolePermissions,
} from "../settings/permissions";

export function Settings({
  account,
  onSignOut,
  notify,
  recordAudit,
}: {
  account: { name: string; email: string };
  onSignOut: () => Promise<string | null>;
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
  const [signOutError, setSignOutError] = useState("");
  const [workspaceName, setWorkspaceName] = useState("Cephas People");
  const [timezone, setTimezone] = useState("Africa/Lagos");
  const [senderName, setSenderName] = useState("Cephas People");
  const [users, setUsers] = useState<TeamUser[]>(loadTeamUsers);
  const [teamStorageError, setTeamStorageError] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("Marketing Staff");
  const [inviteError, setInviteError] = useState("");
  const [editingPermissions, setEditingPermissions] = useState("");
  const [openProvider, setOpenProvider] = useState("");
  const [termiiConfigured, setTermiiConfigured] = useState<boolean | null>(null);
  const [whatsappConfigured, setWhatsappConfigured] = useState<boolean | null>(null);
  const [termiiStatusError, setTermiiStatusError] = useState("");
  const [whatsappStatusError, setWhatsappStatusError] = useState("");
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
    crmApi
      .getSmsProviderStatus()
      .then((status) => { setTermiiConfigured(status.configured); setTermiiStatusError(""); })
      .catch(() => setTermiiStatusError("Could not reach the CRM API to check Termii."));
    crmApi
      .getWhatsAppProviderStatus()
      .then((status) => { setWhatsappConfigured(status.configured); setWhatsappStatusError(""); })
      .catch(() => setWhatsappStatusError("Could not reach the CRM API to check Zoho CPaaS."));
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("cephas.team-users", JSON.stringify(users));
      setTeamStorageError("");
    } catch {
      setTeamStorageError(
        "Could not save team changes in this browser. Changes may be lost when you leave this session.",
      );
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
    if (user) notify(`Role updated for ${user.name} in this browser preview.`);
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
    notify(
      `${label} ${enabled ? "removed from" : "granted to"} ${user.name} in this browser preview.`,
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
    notify(
      `Permissions reset to ${user.role} defaults in this browser preview.`,
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
                <p>
                  Workspace details and the account currently managing this
                  organization.
                </p>
              </div>
              <div className="organization-account-card">
                <div className="avatar user-avatar">
                  {account.name
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase() ?? "")
                    .join("")}
                </div>
                <div className="organization-account-details">
                  <b>{account.name || account.email}</b>
                  <small>{account.email}</small>
                </div>
                <button
                  className="btn secondary"
                  onClick={() => {
                    setSignOutError("");
                    setConfirmSignOut(true);
                  }}
                >
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
              {teamStorageError && (
                <p className="validation-message" role="alert">
                  {teamStorageError}
                </p>
              )}
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
                    notify(
                      `${name} added to this browser preview. No invitation email was sent.`,
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
                <Badge tone={
                  openProvider === "Termii" && termiiConfigured ||
                  openProvider === "WhatsApp Business" && whatsappConfigured
                    ? "Subscribed"
                    : "neutral"
                }>
                  {openProvider === "Termii"
                    ? termiiConfigured ? "API key configured" : termiiStatusError ? "Status unavailable" : termiiConfigured === false ? "API key missing" : "Checking status…"
                    : openProvider === "WhatsApp Business"
                      ? whatsappConfigured ? "API key configured" : whatsappStatusError ? "Status unavailable" : whatsappConfigured === false ? "API key missing" : "Checking status…"
                      : "Setup required"}
                </Badge>
                <h3>{openProvider} setup</h3>
                <p>
                  {openProvider === "Termii"
                    ? "Bulk SMS campaigns are wired to Termii. Keep the API key in the backend environment; it is never sent to this browser."
                    : openProvider === "WhatsApp Business"
                      ? "WhatsApp campaigns use Zoho CPaaS and approved message templates. Keep its channel API key in the backend environment."
                      : "Connect credentials and verify a sender before enabling delivery."}
                </p>
                {openProvider === "Termii" && termiiStatusError && <p className="category-error" role="status">{termiiStatusError}</p>}
                {openProvider === "WhatsApp Business" && whatsappStatusError && <p className="category-error" role="status">{whatsappStatusError}</p>}
              </div>
              <ul>
                {openProvider === "Termii" ? (
                  <>
                    <li>Set TERMII_API_KEY in the CRM API Render environment</li>
                    <li>Use an active sender ID approved in your Termii account</li>
                    <li>Termii generic route is used for promotional SMS</li>
                    <li>Only SMS-subscribed contacts with valid phone numbers are sent</li>
                  </>
                ) : openProvider === "WhatsApp Business" ? (
                  <>
                    <li>Set ZOHO_WHATSAPP_API_KEY in the CRM API Render environment</li>
                    <li>Connect a Meta-approved WABA and verified sender in Zoho CPaaS</li>
                    <li>Use approved Utility or Authentication templates; Marketing templates are unsupported</li>
                    <li>Record WhatsApp opt-in separately on each contact</li>
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
        <div
          className="category-confirm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="signout-title"
        >
          <div className="category-confirm-card">
            <div className="danger-icon">
              <LogOut size={18} />
            </div>
            <h2 id="signout-title">Sign out of Cephas CRM?</h2>
            <p>
              You’ll need to sign in again to access the{" "}
              {account.name || "organization"} workspace.
            </p>
            {signOutError && (
              <p className="validation-message" role="alert">
                {signOutError}
              </p>
            )}
            <div className="category-confirm-actions">
              <button
                className="btn secondary"
                disabled={signingOut}
                onClick={() => {
                  setConfirmSignOut(false);
                  setSignOutError("");
                }}
              >
                Cancel
              </button>
              <button
                className="btn danger"
                disabled={signingOut}
                onClick={async () => {
                  setSigningOut(true);
                  try {
                    const error = await onSignOut();
                    if (error) {
                      setSignOutError(error);
                      return;
                    }
                    setConfirmSignOut(false);
                  } catch (error) {
                    setSignOutError(
                      error instanceof Error
                        ? error.message
                        : "Could not sign out. Please try again.",
                    );
                  } finally {
                    setSigningOut(false);
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
