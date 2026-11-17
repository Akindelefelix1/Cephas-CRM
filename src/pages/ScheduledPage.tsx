import { useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
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
import { ActionMenu } from "../components/ActionMenu";

const calendarTimeZone = "Africa/Lagos";
const dateKey = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: calendarTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
};
const watToday = () => {
  const [year, month, day] = dateKey(new Date()).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
};

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
  notify: (s: string, kind?: "success" | "error" | "loading") => void;
  setModal: (s: string) => void;
  cancelScheduled: (campaign: Campaign) => Promise<void>;
  togglePause: (campaign: Campaign, paused: boolean) => Promise<void>;
}) {
  const [calendar, setCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = watToday();
    return new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1, 12),
    );
  });
  const [busyId, setBusyId] = useState("");
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
        ? `${new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: calendarTimeZone }).format(new Date(campaign.scheduledAt))} WAT`
        : campaign.date,
    }))
    .sort(
      (left, right) =>
        new Date(left.scheduledAt ?? 0).getTime() -
        new Date(right.scheduledAt ?? 0).getTime(),
    );
  const nextScheduled = items.find(
    (campaign) => campaign.status === "Scheduled",
  );
  const monthStart = new Date(
    Date.UTC(
      calendarMonth.getUTCFullYear(),
      calendarMonth.getUTCMonth(),
      1,
      12,
    ),
  );
  const gridStart = new Date(
    Date.UTC(
      monthStart.getUTCFullYear(),
      monthStart.getUTCMonth(),
      1 - monthStart.getUTCDay(),
      12,
    ),
  );
  const days = Array.from(
    { length: 42 },
    (_, offset) =>
      new Date(
        Date.UTC(
          gridStart.getUTCFullYear(),
          gridStart.getUTCMonth(),
          gridStart.getUTCDate() + offset,
          12,
        ),
      ),
  );
  if (loading || error) {
    return (
      <>
        <PageHeading
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
              <b>Loading scheduled campaigns...</b>
            </>
          )}
        </div>
      </>
    );
  }
  return (
    <>
      <PageHeading
        title="Scheduled campaigns"
        desc="Review and manage campaigns scheduled through the CRM API."
        action={
          <button className="btn primary" onClick={() => setModal("email")}>
            <Plus size={16} /> Create campaign
          </button>
        }
      />
      {nextScheduled && (
        <div className="scheduled-banner">
          <div className="schedule-calendar">
            <span>
              {new Intl.DateTimeFormat("en-NG", {
                month: "short",
                timeZone: "Africa/Lagos",
              })
                .format(new Date(nextScheduled.scheduledAt ?? Date.now()))
                .toUpperCase()}
            </span>
            <b>
              {new Intl.DateTimeFormat("en-NG", {
                day: "2-digit",
                timeZone: "Africa/Lagos",
              }).format(new Date(nextScheduled.scheduledAt ?? Date.now()))}
            </b>
            <small>
              {new Intl.DateTimeFormat("en-NG", {
                weekday: "short",
                timeZone: "Africa/Lagos",
              })
                .format(new Date(nextScheduled.scheduledAt ?? Date.now()))
                .toUpperCase()}
            </small>
          </div>
          <div className="scheduled-message">
            <Badge tone="Scheduled">NEXT SCHEDULED</Badge>
            <h2>{nextScheduled.name}</h2>
            <p>Scheduled campaign for {nextScheduled.audience}.</p>
            <div className="scheduled-details">
              <span>
                {nextScheduled.channel === "Email" ? (
                  <Mail size={14} />
                ) : nextScheduled.channel === "WhatsApp" ? (
                  <MessageCircle size={14} />
                ) : (
                  <MessageSquareText size={14} />
                )}{" "}
                {nextScheduled.channel}
              </span>
              <span>
                <Clock3 size={14} /> {nextScheduled.when}
              </span>
            </div>
          </div>
        </div>
      )}
      <div className="section-row">
        <div>
          <h2 className="section-title">
            Upcoming{" "}
            <span className="light-count">
              {items.filter((item) => item.status === "Scheduled").length}
            </span>
          </h2>
          <p className="section-subtitle">
            Schedule times are shown in West Africa Time (UTC+1). Paused
            campaigns remain below so you can resume or cancel them.
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
        <>
          <div className="schedule-calendar-toolbar">
            <button
              className="icon-btn"
              aria-label="Previous month"
              onClick={() =>
                setCalendarMonth(
                  (month) =>
                    new Date(
                      Date.UTC(
                        month.getUTCFullYear(),
                        month.getUTCMonth() - 1,
                        1,
                        12,
                      ),
                    ),
                )
              }
            >
              <ChevronLeft size={17} />
            </button>
            <b>
              {new Intl.DateTimeFormat("en-NG", {
                month: "long",
                year: "numeric",
                timeZone: calendarTimeZone,
              }).format(calendarMonth)}
            </b>
            <button
              className="icon-btn"
              aria-label="Next month"
              onClick={() =>
                setCalendarMonth(
                  (month) =>
                    new Date(
                      Date.UTC(
                        month.getUTCFullYear(),
                        month.getUTCMonth() + 1,
                        1,
                        12,
                      ),
                    ),
                )
              }
            >
              <ChevronRight size={17} />
            </button>
          </div>
          <div className="schedule-calendar-grid">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
              (weekday) => (
                <b className="schedule-weekday" key={weekday}>
                  {weekday}
                </b>
              ),
            )}
            {days.map((day) => {
              const events = items.filter(
                (item) =>
                  item.scheduledAt &&
                  dateKey(new Date(item.scheduledAt)) === dateKey(day),
              );
              const outsideMonth =
                day.getUTCMonth() !== calendarMonth.getUTCMonth();
              return (
                <div
                  className={`schedule-day${outsideMonth ? " outside-month" : ""}`}
                  key={day.toISOString()}
                >
                  <b>
                    {new Intl.DateTimeFormat("en-NG", {
                      day: "numeric",
                      timeZone: calendarTimeZone,
                    }).format(day)}
                  </b>
                  {events.map((item) => (
                    <div className="schedule-event" key={item.id ?? item.name}>
                      <b>{item.name}</b>
                      <small>
                        {item.when} · {item.channel}
                      </small>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </>
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
                <ActionMenu
                  label={item.name}
                  items={[
                    {
                      label:
                        busyId === (item.id ?? item.name)
                          ? "Saving..."
                          : item.status === "Paused"
                            ? "Resume schedule"
                            : "Pause schedule",
                      disabled: Boolean(busyId),
                      onSelect: () =>
                        void runAction(
                          item,
                          (campaign) =>
                            togglePause(campaign, item.status !== "Paused"),
                          item.status === "Paused"
                            ? "Resuming schedule for:"
                            : "Pausing schedule for:",
                        ),
                    },
                    {
                      label: "Cancel schedule",
                      danger: true,
                      disabled: Boolean(busyId),
                      onSelect: () =>
                        void runAction(
                          item,
                          cancelScheduled,
                          "Cancelling schedule for:",
                        ),
                    },
                  ]}
                />
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
