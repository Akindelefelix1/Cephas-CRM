import type { Campaign } from "../models";
import { Badge } from "./Shared";
import { Mail, MessageCircle, MessageSquareText } from "lucide-react";

export function CampaignTable({
  rows,
  onRequestApproval,
  onApprove,
  onSchedule,
  onEdit,
  onSend,
  onDuplicate,
  busyId,
}: {
  rows: Campaign[];
  onRequestApproval?: (campaign: Campaign) => void;
  onApprove?: (campaign: Campaign) => void;
  onSchedule?: (campaign: Campaign) => void;
  onEdit?: (campaign: Campaign) => void;
  onSend?: (campaign: Campaign) => void;
  onDuplicate?: (campaign: Campaign) => void;
  busyId?: string;
}) {
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
            {(onRequestApproval ||
              onSchedule ||
              onEdit ||
              onSend ||
              onDuplicate) && <th>ACTION</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id ?? c.name}>
              <td>
                <div className="campaign-name">
                  <span className={`campaign-mark ${c.tone}`}>
                    {c.channel === "Email" ? (
                      <Mail size={15} />
                    ) : c.channel === "WhatsApp" ? (
                      <MessageCircle size={15} />
                    ) : (
                      <MessageSquareText size={15} />
                    )}
                  </span>
                  <b>{c.name}</b>
                </div>
              </td>
              <td>
                {c.channel === "Email" ? (
                  <span className="channel-label email-label">
                    <Mail size={14} />
                    Email
                  </span>
                ) : c.channel === "WhatsApp" ? (
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
              <td>{c.audience}</td>
              <td>
                <Badge tone={c.status}>{c.status}</Badge>
              </td>
              <td>{c.reach}</td>
              <td>{c.engagement}</td>
              <td>{c.date}</td>
              {(onRequestApproval ||
                onSchedule ||
                onEdit ||
                onSend ||
                onDuplicate) && (
                <td>
                  {onRequestApproval && c.status === "Draft" ? (
                    <button
                      className="text-link"
                      disabled={Boolean(busyId)}
                      onClick={() => onRequestApproval(c)}
                    >
                      {busyId === (c.id ?? c.name)
                        ? "Saving..."
                        : "Submit for approval"}
                    </button>
                  ) : onRequestApproval && c.status === "Pending approval" ? (
                    <button
                      className="text-link"
                      disabled={Boolean(busyId)}
                      onClick={() => onApprove?.(c)}
                    >
                      {busyId === (c.id ?? c.name) ? "Approving..." : "Approve"}
                    </button>
                  ) : onRequestApproval ? (
                    <span className="muted-cell">—</span>
                  ) : null}
                  {onEdit && c.status === "Draft" && (
                    <button
                      className="text-link"
                      disabled={Boolean(busyId)}
                      onClick={() => onEdit(c)}
                    >
                      Edit
                    </button>
                  )}
                  {onSchedule && c.status === "Draft" && c.scheduledAt && (
                    <button
                      className="text-link"
                      disabled={Boolean(busyId)}
                      onClick={() => onSchedule(c)}
                    >
                      {busyId === (c.id ?? c.name)
                        ? "Scheduling..."
                        : "Retry schedule"}
                    </button>
                  )}
                  {onSend &&
                    [
                      "Draft",
                      "Approved",
                      "Failed",
                      "Sent with failures",
                    ].includes(c.status) && (
                      <button
                        className="text-link"
                        disabled={Boolean(busyId)}
                        onClick={() => onSend(c)}
                      >
                        {busyId === (c.id ?? c.name)
                          ? "Sending..."
                          : c.status === "Draft"
                            ? "Send now"
                            : "Retry send"}
                      </button>
                    )}
                  {onDuplicate && (
                    <button
                      className="text-link"
                      onClick={() => onDuplicate(c)}
                    >
                      Duplicate
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
