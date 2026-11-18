import { useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  CheckCheck,
  FileText,
  LoaderCircle,
  Plus,
  Send,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import type { Campaign } from "../models";
import { PageHeading, Stat } from "../components/Shared";
import { CampaignTable } from "../components/CampaignTable";
import { csvCell } from "../utils/csv";

export function CampaignPageFunctional({
  channel,
  records,
  loading,
  error,
  reload,
  setModal,
  notify,
  recordAudit,
  requestApproval,
  approveCampaign,
  scheduleCampaign,
  editCampaign,
  sendCampaign,
  refreshWhatsAppDelivery,
  duplicateCampaign,
}: {
  channel: "Email" | "SMS" | "WhatsApp";
  records: Campaign[];
  loading: boolean;
  error: string;
  reload: () => void;
  setModal: (s: string) => void;
  notify: (s: string, kind?: "success" | "error" | "loading") => void;
  recordAudit: (activity: string, details: string, eventType: string) => void;
  requestApproval: (campaign: Campaign) => Promise<void>;
  approveCampaign: (campaign: Campaign) => Promise<void>;
  scheduleCampaign: (campaign: Campaign) => Promise<void>;
  editCampaign: (campaign: Campaign) => void;
  sendCampaign: (campaign: Campaign) => Promise<void>;
  refreshWhatsAppDelivery: (campaign: Campaign) => Promise<void>;
  duplicateCampaign: (campaign: Campaign) => void;
}) {
  const [status, setStatus] = useState("All");
  const [busyId, setBusyId] = useState("");
  const isMail = channel === "Email",
    isWhatsApp = channel === "WhatsApp",
    channelTitle = isMail ? "Email" : isWhatsApp ? "WhatsApp" : "SMS",
    modalKind = isMail ? "email" : isWhatsApp ? "whatsapp" : "sms",
    allRows = records.filter((c) => c.channel === channel),
    rows = allRows.filter((c) => status === "All" || c.status === status);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const sentThisMonth = allRows.filter((campaign) => {
    if (!campaign.sentAt) return false;
    const sentAt = new Date(campaign.sentAt);
    return sentAt >= monthStart && sentAt < nextMonthStart;
  });
  const runAction = async (
    campaign: Campaign,
    action: (campaign: Campaign) => Promise<void>,
    activity: string,
  ) => {
    if (busyId) return;
    if (!campaign.id) {
      notify(
        `Campaign ${campaign.name} is not linked to a CRM record and cannot be updated.`,
        "error",
      );
      return;
    }
    setBusyId(campaign.id ?? campaign.name);
    notify(`${activity} ${campaign.name}...`, "loading");
    try {
      await action(campaign);
    } catch (reason) {
      notify(
        `Could not update ${campaign.name}: ${reason instanceof Error ? reason.message : "API error"}`,
        "error",
      );
      reload();
    } finally {
      setBusyId("");
    }
  };
  const counts = [
    "All",
    "Draft",
    "Pending approval",
    "Approved",
    "Scheduled",
    "Paused",
    "Sent",
    "Sent with failures",
    "Failed",
  ].map(
    (s) =>
      [s, allRows.filter((c) => s === "All" || c.status === s).length] as const,
  );
  const exportList = () => {
    const csv = [
      "Campaign,Channel,Audience,Status,Reach,Engagement,Date",
      ...rows.map((c) =>
        [c.name, c.channel, c.audience, c.status, c.reach, c.engagement, c.date]
          .map(csvCell)
          .join(","),
      ),
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `cephas-${channel.toLowerCase()}-campaigns.csv`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    recordAudit(
      "Exported campaigns",
      `${rows.length} ${channel} campaign records`,
      "Data export",
    );
    notify(`${rows.length} campaign${rows.length === 1 ? "" : "s"} exported`);
  };
  return (
    <>
      <PageHeading
        eyebrow="COMMUNICATIONS · LIVE CAMPAIGNS"
        title={
          isMail
            ? "Email campaigns"
            : isWhatsApp
              ? "WhatsApp campaigns"
              : "Bulk SMS"
        }
        desc={
          isMail
            ? "Create thoughtful email campaigns and newsletters your audience wants to open."
            : isWhatsApp
              ? "Send approved Zoho CPaaS Utility or Authentication templates to contacts who opted in to WhatsApp."
              : "Reach your audience directly with personalised SMS campaigns."
        }
        action={
          <>
            <button
              className="btn secondary"
              disabled={loading || Boolean(error)}
              onClick={exportList}
            >
              <ArrowDownToLine size={16} /> Export
            </button>
            <button className="btn primary" onClick={() => setModal(modalKind)}>
              <Plus size={17} /> Create {channelTitle} campaign
            </button>
          </>
        }
      />
      <div className="stats-grid compact-stats">
        <Stat
          icon={<Send />}
          label={
            isMail
              ? "Recipients in sent campaigns"
              : isWhatsApp
                ? "WhatsApp messages"
                : "Messages sent"
          }
          value={String(
            sentThisMonth
              .reduce(
                (sum, row) => sum + Number(row.reach === "—" ? 0 : row.reach),
                0,
              ),
          )}
          change="Live"
          hint="this month"
          color="lav"
        />
        <Stat
          icon={<CheckCheck />}
          label="Campaigns sent"
          value={String(
            allRows.filter((row) =>
              ["Sent", "Sent with failures"].includes(row.status),
            ).length,
          )}
          change="Live"
          hint="sent campaigns"
          color="green"
        />
        <Stat
          icon={<TrendingUp />}
          label={
            isMail
              ? "Avg. click rate"
              : isWhatsApp
                ? "Read rate"
                : "Delivery rate"
          }
          value="—"
          change="Live"
          hint="tracking unavailable"
          color="blue"
        />
        <Stat
          icon={<Users />}
          label="Saved campaigns"
          value={String(allRows.length)}
          change="Live"
          hint="in this workspace"
          color="orange"
        />
      </div>
      <div className="campaign-callout">
        <div className="callout-icon">
          <Sparkles size={19} />
        </div>
        <div>
          <b>
            {isMail
              ? "Make your next email one to remember"
              : isWhatsApp
                ? "Start a personal WhatsApp conversation"
                : "A timely text makes all the difference"}
          </b>
          <p>
            {isMail
              ? "Pick a template, personalise your message and preview before it goes out."
              : isWhatsApp
                ? "Choose an audience and approved template. Review consent and message details before sending."
                : "Choose your audience, check message parts and estimated cost before sending."}
          </p>
        </div>
        <button className="btn secondary" onClick={() => setModal(modalKind)}>
          Start creating <ArrowUpRight size={15} />
        </button>
      </div>
      <section className="panel table-panel">
        <div className="panel-heading">
          <div>
            <h2>
              {channelTitle} campaigns{" "}
              <span className="light-count">{rows.length} shown</span>
            </h2>
            <p>
              {isMail
                ? "Email content, recipients, delivery status, and schedules are saved through the CRM API."
                : isWhatsApp
                  ? "WhatsApp delivery needs a connected business messaging provider."
                  : "SMS drafts and send results are saved through the CRM API. Only contacts opted in to SMS are included."}
            </p>
          </div>
        </div>
        <div className="tab-row">
          {counts.map(([name, count]) => (
            <button
              key={name}
              className={`tab ${status === name ? "active" : ""}`}
              onClick={() => setStatus(name)}
            >
              {name === "All" ? "All campaigns" : name}
              <span>{count}</span>
            </button>
          ))}
        </div>
        {error ? (
          <div className="empty-state" role="alert">
            <b>Could not load campaigns</b>
            <span>{error}</span>
            <button className="btn secondary" onClick={reload}>
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="empty-state" aria-live="polite">
            <LoaderCircle className="spin" size={20} />
            <b>Loading campaigns…</b>
          </div>
        ) : rows.length ? (
          <CampaignTable
            rows={rows}
            onRequestApproval={(campaign) =>
              void runAction(
                campaign,
                requestApproval,
                "Submitting for approval:",
              )
            }
            onApprove={(campaign) =>
              void runAction(campaign, approveCampaign, "Approving campaign:")
            }
            onSchedule={(campaign) =>
              void runAction(campaign, scheduleCampaign, "Scheduling campaign:")
            }
            onEdit={editCampaign}
            onSend={(campaign) =>
              void runAction(campaign, sendCampaign, "Sending campaign:")
            }
            onRefreshDelivery={(campaign) =>
              void runAction(
                campaign,
                refreshWhatsAppDelivery,
                "Refreshing delivery status for:",
              )
            }
            onDuplicate={duplicateCampaign}
            busyId={busyId}
          />
        ) : (
          <div className="empty-state">
            <FileText size={20} />
            <b>No {status.toLowerCase()} campaigns</b>
            <span>
              There are no {status.toLowerCase()} campaigns saved in this
              workspace.
            </span>
            <button className="btn secondary" onClick={() => setStatus("All")}>
              Show all campaigns
            </button>
          </div>
        )}
        <div className="table-footer">
          <span>
            Showing <b>{rows.length}</b> of {allRows.length} saved campaigns
          </span>
        </div>
      </section>
    </>
  );
}
