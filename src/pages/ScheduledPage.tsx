import { useState } from "react";
import {
  CalendarDays,
  Clock3,
  LoaderCircle,
  Mail,
  MessageCircle,
  MessageSquareText,
  Plus,
  ShieldCheck,
} from "lucide-react";
import type { Campaign } from "../models";
import { Badge, PageHeading } from "../components/Shared";

export function ScheduledPreview({
  records,
  loading,
  error,
  reload,
  notify,
  setModal,
  cancelScheduled,
  togglePause,
}: {
  records: Campaign[];
  loading: boolean;
  error: string;
  reload: () => void;
  notify: (s: string) => void;
  setModal: (s: string) => void;
  cancelScheduled: (campaign: Campaign) => Promise<void>;
  togglePause: (campaign: Campaign, paused: boolean) => Promise<void>;
}) {
  const [calendar, setCalendar] = useState(false);
  const [busyId, setBusyId] = useState("");
  const runAction = async (
    campaign: Campaign,
    action: (campaign: Campaign) => Promise<void>,
  ) => {
    if (busyId) return;
    setBusyId(campaign.id ?? campaign.name);
    try {
      await action(campaign);
    } catch (reason) {
      notify(
        `Could not update ${campaign.name}: ${reason instanceof Error ? reason.message : "API error"}`,
      );
    } finally {
      setBusyId("");
    }
  };
  const items = records
    .filter(
      (campaign) =>
        campaign.status === "Scheduled" || campaign.status === "Paused",
    )
    .map((campaign) => ({
      ...campaign,
      when: campaign.scheduledAt
        ? `${new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }).format(new Date(campaign.scheduledAt))} WAT`
        : campaign.date,
    }))
    .sort(
      (left, right) =>
        new Date(left.scheduledAt ?? 0).getTime() -
        new Date(right.scheduledAt ?? 0).getTime(),
    );
  const days = [
    ...Array.from({ length: 7 }, (_, offset) => {
      const date = new Date();
      date.setDate(date.getDate() + offset);
      return date;
    }),
  ];
  if (loading || error) {
    return (
      <>
        <PageHeading
          eyebrow="SCHEDULED · LIVE"
          title="Scheduled campaigns"
          desc="Review and manage campaigns scheduled through the CRM API."
          action={
            <button className="btn primary" onClick={() => setModal("email")}>
              <Plus size={16} /> Create campaign
            </button>
          }
        />
        <div
          className="empty-state"
          aria-live="polite"
          role={error ? "alert" : undefined}
        >
          {error ? (
            <>
              <b>Could not load scheduled campaigns</b>
              <span>{error}</span>
              <button className="btn secondary" onClick={reload}>
                Retry
              </button>
            </>
          ) : (
            <>
              <LoaderCircle className="spin" size={20} />
              <b>Loading scheduled campaigns…</b>
            </>
          )}
        </div>
      </>
    );
  }
  return (
    <>
      <PageHeading
        eyebrow="SCHEDULED · LIVE"
        title="Scheduled campaigns"
        desc="Review and manage campaigns scheduled through the CRM API."
        action={
          <button className="btn primary" onClick={() => setModal("email")}>
            <Plus size={16} /> Create campaign
          </button>
        }
      />
      {items.length > 0 && (
        <div className="scheduled-banner">
          <div className="schedule-calendar">
            <span>
              {new Intl.DateTimeFormat("en-NG", {
                month: "short",
                timeZone: "Africa/Lagos",
              })
                .format(new Date(items[0].scheduledAt ?? Date.now()))
                .toUpperCase()}
            </span>
            <b>
              {new Intl.DateTimeFormat("en-NG", {
                day: "2-digit",
                timeZone: "Africa/Lagos",
              }).format(new Date(items[0].scheduledAt ?? Date.now()))}
            </b>
            <small>
              {new Intl.DateTimeFormat("en-NG", {
                weekday: "short",
                timeZone: "Africa/Lagos",
              })
                .format(new Date(items[0].scheduledAt ?? Date.now()))
                .toUpperCase()}
            </small>
          </div>
          <div className="scheduled-message">
            <Badge tone="Scheduled">NEXT SCHEDULED</Badge>
            <h2>{items[0].name}</h2>
            <p>Scheduled campaign · {items[0].audience}.</p>
            <div className="scheduled-details">
              <span>
                {items[0].channel === "Email" ? (
                  <Mail size={14} />
                ) : items[0].channel === "WhatsApp" ? (
                  <MessageCircle size={14} />
                ) : (
                  <MessageSquareText size={14} />
                )}{" "}
                {items[0].channel}
              </span>
              <span>
                <Clock3 size={14} /> {items[0].when}
              </span>
            </div>
          </div>
        </div>
      )}
      <div className="section-row">
        <div>
          <h2 className="section-title">
            Upcoming <span className="light-count">{items.length}</span>
          </h2>
          <p className="section-subtitle">
            Schedule times are shown in West Africa Time (UTC+1).
          </p>
        </div>
        <button
          className="btn secondary"
          onClick={() => setCalendar((value) => !value)}
        >
          <CalendarDays size={15} /> {calendar ? "List view" : "Calendar view"}
        </button>
      </div>
      {calendar ? (
        <div className="schedule-calendar-grid">
          {days.map((day) => {
            const events = items.filter(
              (item) =>
                item.scheduledAt &&
                new Date(item.scheduledAt).toDateString() ===
                  day.toDateString(),
            );
            return (
              <div className="schedule-day" key={day.toISOString()}>
                <b>
                  {new Intl.DateTimeFormat("en-NG", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  }).format(day)}
                </b>
                {events.map((item) => (
                  <div className="schedule-event" key={item.name}>
                    <b>{item.name}</b>
                    <small>
                      {item.when.split(" · ")[1]} · {item.channel}
                    </small>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <section className="panel scheduled-list">
          {items.length === 0 ? (
            <div className="empty-state">
              <CalendarDays size={20} />
              <b>No upcoming campaigns</b>
              <span>Schedule an email campaign to see it here.</span>
              <button
                className="btn secondary"
                onClick={() => setModal("email")}
              >
                Create campaign
              </button>
            </div>
          ) : (
            items.map((item) => (
              <article className="scheduled-row" key={item.name}>
                <div className={`campaign-mark ${item.tone}`}>
                  {item.channel === "Email" ? (
                    <Mail size={16} />
                  ) : item.channel === "WhatsApp" ? (
                    <MessageCircle size={16} />
                  ) : (
                    <MessageSquareText size={16} />
                  )}
                </div>
                <div className="scheduled-row-main">
                  <b>{item.name}</b>
                  <small>{item.audience}</small>
                </div>
                <div className="scheduled-row-date">
                  <Clock3 size={14} />
                  {item.when}
                </div>
                <Badge tone={item.status}>{item.status}</Badge>
                <button
                  className="btn secondary"
                  disabled={busyId === (item.id ?? item.name)}
                  onClick={() =>
                    void runAction(item, (campaign) =>
                      togglePause(campaign, item.status !== "Paused"),
                    )
                  }
                >
                  {busyId === (item.id ?? item.name)
                    ? "Saving..."
                    : item.status === "Paused"
                      ? "Resume"
                      : "Pause"}
                </button>
                <button
                  className="btn secondary cancel-schedule"
                  disabled={busyId === (item.id ?? item.name)}
                  onClick={() => void runAction(item, cancelScheduled)}
                >
                  Cancel schedule
                </button>
              </article>
            ))
          )}
        </section>
      )}
      <p className="compliance-note">
        <ShieldCheck size={16} /> Suppression checks must run immediately before
        any real send.
      </p>
    </>
  );
}
