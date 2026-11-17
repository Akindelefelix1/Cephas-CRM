import { useEffect, useState } from "react";
import { CircleAlert, Mail, MessageCircle, MessageSquareText, X } from "lucide-react";
import type { Campaign } from "../models";
import { ActionMenu, type ActionMenuItem } from "./ActionMenu";
import { Badge } from "./Shared";

export function CampaignTable({
  rows,
  onRequestApproval,
  onApprove,
  onSchedule,
  onEdit,
  onSend,
  onDuplicate,
  onRefreshDelivery,
  busyId,
}: {
  rows: Campaign[];
  onRequestApproval?: (campaign: Campaign) => void;
  onApprove?: (campaign: Campaign) => void;
  onSchedule?: (campaign: Campaign) => void;
  onEdit?: (campaign: Campaign) => void;
  onSend?: (campaign: Campaign) => void;
  onDuplicate?: (campaign: Campaign) => void;
  onRefreshDelivery?: (campaign: Campaign) => void;
  busyId?: string;
}) {
  const [selectedError, setSelectedError] = useState<{ campaignName: string; message: string } | null>(null);

  useEffect(() => {
    if (!selectedError) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedError(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedError]);
  const hasActions =
    onRequestApproval ||
    onSchedule ||
    onEdit ||
    onSend ||
    onRefreshDelivery ||
    onDuplicate;

  const actionsFor = (campaign: Campaign): ActionMenuItem[] => {
    const busy = busyId === (campaign.id ?? campaign.name);
    return [
      ...(onRequestApproval && campaign.status === "Draft"
        ? [
            {
              label: busy ? "Submitting..." : "Submit for approval",
              onSelect: () => onRequestApproval(campaign),
              disabled: Boolean(busyId),
            },
          ]
        : onRequestApproval &&
            campaign.status === "Pending approval" &&
            onApprove
          ? [
              {
                label: busy ? "Approving..." : "Approve",
                onSelect: () => onApprove(campaign),
                disabled: Boolean(busyId),
              },
            ]
          : []),
      ...(onEdit && campaign.status === "Draft"
        ? [
            {
              label: "Edit",
              onSelect: () => onEdit(campaign),
              disabled: Boolean(busyId),
            },
          ]
        : []),
      ...(onSchedule && campaign.status === "Draft" && campaign.scheduledAt
        ? [
            {
              label: busy ? "Scheduling..." : "Retry schedule",
              onSelect: () => onSchedule(campaign),
              disabled: Boolean(busyId),
            },
          ]
        : []),
      ...(onSend &&
      ["Draft", "Approved", "Failed", "Sent with failures"].includes(
        campaign.status,
      )
        ? [
            {
              label: busy
                ? "Sending..."
                : campaign.status === "Draft"
                  ? "Send now"
                  : "Retry send",
              onSelect: () => onSend(campaign),
              disabled: Boolean(busyId),
            },
          ]
        : []),
      ...(onRefreshDelivery &&
      campaign.channel === "WhatsApp" &&
      ["Sent", "Sent with failures"].includes(campaign.status)
        ? [
            {
              label: busy ? "Refreshing..." : "Refresh delivery",
              onSelect: () => onRefreshDelivery(campaign),
              disabled: Boolean(busyId),
            },
          ]
        : []),
      ...(onDuplicate
        ? [
            {
              label: "Duplicate",
              onSelect: () => onDuplicate(campaign),
              disabled: Boolean(busyId),
            },
          ]
        : []),
    ];
  };

  return (
    <div className="table-scroll">
      <table className="campaign-table">
        <thead>
          <tr>
            <th>CAMPAIGN</th>
            <th>CHANNEL</th>
            <th>AUDIENCE</th>
            <th>STATUS</th>
            <th>REACH</th>
            <th>ENGAGEMENT</th>
            <th>DATE</th>
            {hasActions && <th>ACTION</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((campaign) => (
            <tr key={campaign.id ?? campaign.name}>
              <td>
                <div className="campaign-name">
                  <span className={`campaign-mark ${campaign.tone}`}>
                    {campaign.channel === "Email" ? (
                      <Mail size={15} />
                    ) : campaign.channel === "WhatsApp" ? (
                      <MessageCircle size={15} />
                    ) : (
                      <MessageSquareText size={15} />
                    )}
                  </span>
                  <b>{campaign.name}</b>
                </div>
              </td>
              <td>
                {campaign.channel === "Email" ? (
                  <span className="channel-label email-label">
                    <Mail size={14} />
                    Email
                  </span>
                ) : campaign.channel === "WhatsApp" ? (
                  <span className="channel-label whatsapp-label">
                    <MessageCircle size={14} />
                    WhatsApp
                  </span>
                ) : (
                  <span className="channel-label sms-label">
                    <MessageSquareText size={14} />
                    SMS
                  </span>
                )}
              </td>
              <td>{campaign.audience}</td>
              <td>
                <Badge tone={campaign.status}>{campaign.status}</Badge>
                {campaign.lastError && (
                  <button
                    type="button"
                    className="campaign-row-error"
                    aria-label={`Read full failure message for ${campaign.name}`}
                    onClick={() => setSelectedError({ campaignName: campaign.name, message: campaign.lastError! })}
                  >
                    <span>View error details</span>
                  </button>
                )}
              </td>
              <td>{campaign.reach}</td>
              <td>{campaign.engagement}</td>
              <td>{campaign.date}</td>
              {hasActions && (
                <td>
                  <ActionMenu
                    label={campaign.name}
                    items={actionsFor(campaign)}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {selectedError && (
        <div className="category-confirm campaign-error-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedError(null);
        }}>
          <section className="category-confirm-card campaign-error-dialog" role="dialog" aria-modal="true" aria-labelledby="campaign-error-title" aria-describedby="campaign-error-message">
            <div className="campaign-error-dialog-head">
              <div className="danger-icon"><CircleAlert size={18} /></div>
              <button type="button" className="campaign-error-close" aria-label="Close error details" onClick={() => setSelectedError(null)}><X size={18} /></button>
            </div>
            <h2 id="campaign-error-title">Campaign error details</h2>
            <p className="campaign-error-campaign-name">{selectedError.campaignName}</p>
            <pre id="campaign-error-message" className="campaign-error-full-message">{selectedError.message}</pre>
            <div className="category-confirm-actions"><button type="button" className="btn secondary" onClick={() => setSelectedError(null)}>Close</button></div>
          </section>
        </div>
      )}
    </div>
  );
}
