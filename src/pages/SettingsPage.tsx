import { useEffect, useState } from "react";
import { Blocks, LoaderCircle, LogOut, Mail, MessageCircle, MessageSquareText, Plus, RefreshCw, Settings2, ShieldCheck, Users } from "lucide-react";
import type { ApiPrivacyRequest, ApiSettings } from "../api";
import { crmApi } from "../api";
import { Badge, PageHeading } from "../components/Shared";

const tabs = ["General", "Users & roles", "Consent & suppression", "Security & privacy", "Integrations"];

export function Settings({ account, onSignOut, notify, recordAudit, onWorkspaceNameChange }: {
  account: { name: string; email: string };
  onSignOut: () => Promise<string | null>;
  notify: (message: string) => void;
  recordAudit: (activity: string, details: string, eventType: string) => void;
  onWorkspaceNameChange: (name: string) => void;
}) {
  const [tab, setTab] = useState("General");
  const [settings, setSettings] = useState<ApiSettings | null>(null);
  const [workspaceName, setWorkspaceName] = useState("");
  const [timezone, setTimezone] = useState("Africa/Lagos");
  const [senderName, setSenderName] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [privacyRequestType, setPrivacyRequestType] = useState<ApiPrivacyRequest["requestType"]>("Access");
  const [privacyRequestEmail, setPrivacyRequestEmail] = useState("");
  const [savingPrivacyRequest, setSavingPrivacyRequest] = useState(false);
  const [privacyError, setPrivacyError] = useState("");
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const [zohoTestState, setZohoTestState] = useState<{ status: "idle" | "checking" | "success" | "error"; message: string }>({ status: "idle", message: "" });

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    crmApi.getSettings().then((response) => {
      if (!active) return;
      setSettings(response);
      setWorkspaceName(response.workspace.organizationName);
      setTimezone(response.workspace.timezone);
      setSenderName(response.workspace.senderName);
    }).catch((error: unknown) => {
      if (active) setLoadError(error instanceof Error ? error.message : "Could not load settings from the CRM API.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);

  const saveSettings = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const saved = await crmApi.updateSettings({ organizationName: workspaceName, timezone, senderName });
      setSettings((current) => current ? { ...current, workspace: saved } : current);
      onWorkspaceNameChange(saved.organizationName);
      recordAudit("Updated workspace settings", `${saved.organizationName} · ${saved.timezone}`, "Settings updated");
      notify("Workspace settings saved");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save workspace settings.";
      setSaveError(message);
      notify(`Could not save settings: ${message}`);
    } finally { setSaving(false); }
  };

  const logPrivacyRequest = async () => {
    const email = privacyRequestEmail.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setPrivacyError("Enter a valid contact email address.");
      return;
    }
    setSavingPrivacyRequest(true);
    setPrivacyError("");
    try {
      const saved = await crmApi.createPrivacyRequest({ requestType: privacyRequestType, email });
      setSettings((current) => current ? { ...current, privacyRequests: [saved, ...current.privacyRequests].slice(0, 100) } : current);
      setPrivacyRequestEmail("");
      recordAudit("Logged data rights request", `${saved.requestType} · ${saved.email}`, "Privacy request");
      notify("Data rights request saved");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save the privacy request.";
      setPrivacyError(message);
      notify(`Could not save privacy request: ${message}`);
    } finally { setSavingPrivacyRequest(false); }
  };

  const testZohoConnection = async () => {
    setZohoTestState({ status: "checking", message: "Checking Zoho Campaigns credentials and API access…" });
    try {
      const result = await crmApi.testZohoCampaignsConnection();
      setZohoTestState({ status: "success", message: `${result.provider} connection succeeded.` });
    } catch (error) {
      setZohoTestState({ status: "error", message: error instanceof Error ? error.message : "Could not connect to Zoho Campaigns." });
    }
  };

  const signedInitials = (account.name || account.email).trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
  const integrationCards = settings ? [
    { key: "email", name: settings.integrations.email.provider, detail: "Email campaigns", status: settings.integrations.email.configured, sender: settings.integrations.email.sender, icon: <Mail size={17} />, tone: "mail-icon" },
    { key: "sms", name: settings.integrations.sms.provider, detail: "Bulk SMS", status: settings.integrations.sms.configured, sender: settings.integrations.sms.sender, icon: <MessageSquareText size={17} />, tone: "sms-icon" },
    { key: "whatsapp", name: settings.integrations.whatsapp.provider, detail: "WhatsApp campaigns", status: settings.integrations.whatsapp.configured, sender: settings.integrations.whatsapp.sender, icon: <MessageCircle size={17} />, tone: "whatsapp-icon" },
  ] : [];

  return <>
    <PageHeading eyebrow="YOUR WORKSPACE" title="Settings" desc="Manage workspace preferences, consent policies and connected services." />
    <div className="settings-layout">
      <nav className="settings-nav" aria-label="Settings sections">{tabs.map((name, index) => <button type="button" className={tab === name ? "active" : ""} aria-current={tab === name ? "page" : undefined} onClick={() => setTab(name)} key={name}>{[<Settings2 size={16} />, <Users size={16} />, <ShieldCheck size={16} />, <ShieldCheck size={16} />, <Blocks size={16} />][index]}{name}</button>)}</nav>
      <section className="panel settings-panel">
        <div className="settings-section-heading"><h2>{tab}</h2><p>{tab === "General" ? "Configure workspace preferences." : tab === "Users & roles" ? "Review the account that owns this isolated workspace." : tab === "Consent & suppression" ? "Review the consent checks applied before campaign sends." : tab === "Security & privacy" ? "Review authentication and persist data rights requests." : "View provider configuration held securely by the CRM API."}</p></div>
        {loadError ? <div className="analytics-state error" role="alert"><b>Could not load settings</b><span>{loadError}</span><button className="btn secondary" onClick={() => setReloadKey((value) => value + 1)}><RefreshCw size={14} /> Retry</button></div> : loading || !settings ? <div className="analytics-state" role="status"><LoaderCircle size={18} className="auth-spinner" />Loading settings from the CRM API…</div> : <>
          {tab === "General" && <>
            <div className="settings-section-heading organization-profile-heading"><h3>Organization profile</h3><p>These preferences are saved to your authenticated workspace.</p></div>
            <div className="organization-account-card"><div className="avatar user-avatar">{signedInitials}</div><div className="organization-account-details"><b>{account.name || account.email}</b><small>{account.email}</small></div><button className="btn secondary" onClick={() => { setSignOutError(""); setConfirmSignOut(true); }}><LogOut size={15} /> Sign out</button></div>
            <label className="form-label">Organization name<input maxLength={120} value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} /></label>
            <label className="form-label">Workspace timezone preference<select value={timezone} onChange={(event) => setTimezone(event.target.value)}><option>Africa/Lagos</option><option>UTC</option><option>Europe/London</option><option>America/New_York</option></select><small className="settings-hint">Saved to your workspace profile. Campaign send scheduling uses the timezone configured for the delivery provider.</small></label>
            <label className="form-label">Workspace sender label<input maxLength={80} value={senderName} onChange={(event) => setSenderName(event.target.value)} /><small className="settings-hint">Saved as workspace profile information. The active sender name must be configured with the delivery provider.</small></label>
            {saveError && <p className="validation-message" role="alert">{saveError}</p>}
            <div className="settings-save"><small>{settings.workspace.updatedAt ? `Last saved ${new Date(settings.workspace.updatedAt).toLocaleString()}` : "Not saved yet"}</small><button className="btn primary" disabled={saving || !workspaceName.trim() || !senderName.trim()} onClick={() => void saveSettings()}>{saving && <LoaderCircle size={15} className="auth-spinner" />}{saving ? "Saving…" : "Save settings"}</button></div>
          </>}
          {tab === "Users & roles" && <><div className="superadmin-notice"><span><ShieldCheck size={18} /></span><div><b>Account access</b><p>Only the signed-in account can manage these settings. Team invitations and role-based access are not enabled by the current identity setup.</p></div><Badge tone="neutral">Account</Badge></div><div className="organization-account-card"><div className="avatar user-avatar">{signedInitials}</div><div className="organization-account-details"><b>{account.name || account.email}</b><small>{account.email}</small></div><Badge tone="neutral">Signed in</Badge></div></>}
          {tab === "Consent & suppression" && <><div className="consent-info"><ShieldCheck size={18} /><div><b>Consent checks run before sending</b><p>Campaign recipients must be subscribed for the selected channel. New contacts default to pending consent.</p></div></div>{([["Email campaign suppression", settings.policies.emailConsentRequiredForSend], ["SMS campaign suppression", settings.policies.smsConsentRequiredForSend], ["WhatsApp campaign suppression", settings.policies.whatsappConsentRequiredForSend]] as const).map(([label, enabled]) => <div className="preference-row" key={label}><div><b>{label}</b><small>Enforced by the CRM API before campaign delivery</small></div><Badge tone={enabled ? "Subscribed" : "neutral"}>{enabled ? "Enforced" : "Not enabled"}</Badge></div>)}<div className="preference-row"><div><b>Default consent for imported contacts</b><small>Contacts require an explicit opt-in before campaign delivery</small></div><Badge tone="neutral">{settings.policies.importedContactsDefaultConsent}</Badge></div></>}
          {tab === "Security & privacy" && <div className="security-privacy-settings"><div className="consent-info"><ShieldCheck size={18} /><div><b>Authentication</b><p>API requests are verified against Neon Auth. Multi-factor policy is managed by the identity provider and is not changed from CRM settings.</p></div><Badge tone="neutral">{settings.policies.twoFactorManagedBy}</Badge></div><div className="privacy-request-form"><div><h3>Data rights requests</h3><p>Record access, correction, and deletion requests for follow-up.</p></div><div className="field-pair"><label className="form-label">Request type<select value={privacyRequestType} onChange={(event) => setPrivacyRequestType(event.target.value as ApiPrivacyRequest["requestType"])}><option>Access</option><option>Correction</option><option>Deletion</option></select></label><label className="form-label">Contact email<input type="email" maxLength={254} value={privacyRequestEmail} onChange={(event) => { setPrivacyRequestEmail(event.target.value); setPrivacyError(""); }} placeholder="name@example.com" /></label></div>{privacyError && <p className="validation-message" role="alert">{privacyError}</p>}<button className="btn primary" disabled={savingPrivacyRequest} onClick={() => void logPrivacyRequest()}>{savingPrivacyRequest ? <LoaderCircle size={15} className="auth-spinner" /> : <Plus size={15} />}{savingPrivacyRequest ? "Saving request…" : "Log request"}</button></div><div className="privacy-request-list"><h3>Request register</h3>{settings.privacyRequests.length ? settings.privacyRequests.map((request) => <div className="preference-row" key={request.id}><span><b>{request.requestType} request</b><small>{request.email} · {new Date(request.createdAt).toLocaleString()}</small></span><Badge tone="neutral">{request.status}</Badge></div>) : <p className="empty-subtext">No data rights requests have been recorded.</p>}</div><p className="settings-disclaimer">A logged request is a tracking record; verify the requester and complete the request through your privacy workflow.</p></div>}
          {tab === "Integrations" && <><div className="integration-grid">{integrationCards.map((integration) => <div className="integration-card" key={integration.key}><div className={`channel-icon ${integration.tone}`}>{integration.icon}</div><div><b>{integration.name}</b><small>{integration.detail}{integration.sender ? ` · ${integration.sender}` : ""}</small></div><Badge tone={integration.status ? "Subscribed" : "neutral"}>{integration.status ? "Configured" : "Not configured"}</Badge></div>)}</div><div className="provider-setup"><div><h3>Provider credentials</h3><p>Credentials remain on the CRM API and are never returned to this browser. Configure missing values in the backend hosting environment.</p></div><ul><li>Email campaigns use Zoho Campaigns credentials.</li><li>Bulk SMS uses Termii and its configured sender ID.</li><li>WhatsApp campaigns use Zoho CPaaS and an approved sender.</li></ul></div><section className="zoho-setup-guide"><div className="zoho-setup-heading"><div><h3>Connect Zoho Campaigns</h3><p>Create a Self Client in Zoho, grant the required scopes, then save its credentials in the CRM API environment.</p></div><button type="button" className="btn secondary" disabled={zohoTestState.status === "checking" || !settings.integrations.email.configured} onClick={() => void testZohoConnection()}>{zohoTestState.status === "checking" ? <LoaderCircle size={15} className="auth-spinner" /> : <RefreshCw size={15} />}{zohoTestState.status === "checking" ? "Testing…" : "Test connection"}</button></div><ol><li>Open the <a href="https://api-console.zoho.com/" target="_blank" rel="noreferrer">Zoho API Console</a>, create a <b>Self Client</b>, and copy its Client ID and Client Secret.</li><li>Generate a grant code for <code>ZohoCampaigns.campaign.ALL,ZohoCampaigns.contact.CREATE,ZohoCampaigns.contact.UPDATE</code>. Use the code to generate a refresh token. Keep the refresh token private.</li><li>In Zoho Campaigns, make sure the sender email is verified and approved for campaign sending.</li><li>In Render, open the <b>cephas-crm-api</b> service’s Environment page and set the values below. Use the matching accounts and Campaigns domains for your Zoho data center.</li></ol><div className="zoho-env-vars"><code>ZOHO_CAMPAIGNS_CLIENT_ID</code><code>ZOHO_CAMPAIGNS_CLIENT_SECRET</code><code>ZOHO_CAMPAIGNS_REFRESH_TOKEN</code><code>ZOHO_CAMPAIGNS_FROM_EMAIL</code><code>ZOHO_CAMPAIGNS_ACCOUNTS_URL</code><code>ZOHO_CAMPAIGNS_API_URL</code></div><p className="settings-hint">Use <code>https://accounts.zoho.com</code> and <code>https://campaigns.zoho.com/api/v1.1</code> for Zoho’s US data center. For EU, India, Australia, Japan, or China, change both URLs to the domains shown in your Zoho Campaigns account. <code>API_PUBLIC_URL</code> is set from Render’s service URL when available.</p>{zohoTestState.message && <p className={`zoho-test-result ${zohoTestState.status}`} role={zohoTestState.status === "error" ? "alert" : "status"}>{zohoTestState.message}</p>}<p className="settings-hint"><a href="https://www.zoho.com/campaigns/help/developers/access-token.html" target="_blank" rel="noreferrer">Zoho Campaigns OAuth scopes and token guide</a> · <a href="https://www.zoho.com/campaigns/help/developers/data-centers.html" target="_blank" rel="noreferrer">Zoho data center URLs</a></p></section></>}
        </>}
      </section>
    </div>
    {confirmSignOut && <div className="category-confirm" role="alertdialog" aria-modal="true" aria-labelledby="signout-title"><div className="category-confirm-card"><div className="danger-icon"><LogOut size={18} /></div><h2 id="signout-title">Sign out of Cephas CRM?</h2><p>You’ll need to sign in again to access this workspace.</p>{signOutError && <p className="validation-message" role="alert">{signOutError}</p>}<div className="category-confirm-actions"><button className="btn secondary" disabled={signingOut} onClick={() => setConfirmSignOut(false)}>Cancel</button><button className="btn danger" disabled={signingOut} onClick={async () => { setSigningOut(true); try { const error = await onSignOut(); if (error) setSignOutError(error); else setConfirmSignOut(false); } catch (error) { setSignOutError(error instanceof Error ? error.message : "Could not sign out. Please try again."); } finally { setSigningOut(false); } }}>{signingOut ? "Signing out…" : "Sign out"}</button></div></div></div>}
  </>;
}
