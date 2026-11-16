import { useState } from "react";
import { ArrowDownToLine, Search, ShieldCheck } from "lucide-react";
import type { AuditEvent } from "../models";
import { Badge, PageHeading } from "../components/Shared";
import { auditRows } from "../data/fixtures";

export function AuditLogPreview({
  events,
  notify,
  recordAudit,
}: {
  events: AuditEvent[];
  notify: (s: string) => void;
  recordAudit: (activity: string, details: string, eventType: string) => void;
}) {
  const [query, setQuery] = useState(""),
    [kind, setKind] = useState("All activity");
  const shown = events.filter(
    (r) =>
      r.join(" ").toLowerCase().includes(query.toLowerCase()) &&
      (kind === "All activity" || r[3] === kind),
  );
  const exportLog = () => {
    const csv = [
      "User,Activity,Details,Event type,Date and time",
      ...shown.map((r) =>
        r
          .slice(0, 5)
          .map((v) => `"${v.replaceAll('"', '""')}"`)
          .join(","),
      ),
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "cephas-audit-preview.csv";
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    recordAudit("Exported audit log", `${shown.length} events`, "Data export");
    notify(`${shown.length} preview audit events exported`);
  };
  return (
    <>
      <PageHeading
        eyebrow="SAMPLE ACTIVITY · UI PREVIEW"
        title="Audit log"
        desc="Review illustrative CRM activity with an actor, action, event type and timestamp."
        action={
          <button className="btn secondary" onClick={exportLog}>
            <ArrowDownToLine size={16} /> Export visible events
          </button>
        }
      />
      <div className="audit-callout">
        <div className="audit-shield">
          <ShieldCheck size={21} />
        </div>
        <div>
          <b>Audit log interface preview</b>
          <p>
            These sample events show the activity details the connected
            application should record.
          </p>
        </div>
        <Badge tone="neutral">Illustrative data</Badge>
      </div>
      <section className="panel table-panel audit-panel">
        <div className="panel-heading">
          <div>
            <h2>
              Sample activity{" "}
              <span className="light-count">{shown.length} shown</span>
            </h2>
            <p>Filter the sample rows or export the visible events.</p>
          </div>
          <div className="audit-filters">
            <div className="search-input">
              <Search size={15} />
              <input
                aria-label="Search audit events"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search events"
              />
            </div>
            <select
              aria-label="Filter audit event type"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              <option>All activity</option>
              {[...new Set(auditRows.map((r) => r[3]))].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="table-scroll">
          <table className="audit-table">
            <thead>
              <tr>
                <th>USER</th>
                <th>ACTIVITY</th>
                <th>DETAILS</th>
                <th>EVENT TYPE</th>
                <th>DATE & TIME</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r, i) => (
                <tr key={`${r[0]}-${r[1]}`}>
                  <td>
                    <div className="contact-cell">
                      <div
                        className={`avatar ${["lavender", "peach", "mint", "blue", "pink", "yellow"][i % 6]}`}
                      >
                        {r[0]
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <b>{r[0]}</b>
                    </div>
                  </td>
                  <td>
                    <span className="audit-action">
                      <i className={`event-dot ${r[5]}`} />
                      {r[1]}
                    </span>
                  </td>
                  <td>{r[2]}</td>
                  <td>
                    <Badge tone="neutral">{r[3]}</Badge>
                  </td>
                  <td>{r[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {shown.length === 0 && (
            <div className="empty-state">
              <Search size={20} />
              <b>No activity matches this filter</b>
              <span>Try another search term or event type.</span>
              <button
                className="btn secondary"
                onClick={() => {
                  setQuery("");
                  setKind("All activity");
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
        <div className="table-footer">
          <span>
            Showing <b>{shown.length}</b> of {events.length} preview events
          </span>
          <span>Pagination requires connected audit data</span>
        </div>
      </section>
      <p className="compliance-note">
        <ShieldCheck size={16} /> Persistent audit records, retention rules and
        actor identity must be implemented with the backend.
      </p>
    </>
  );
}
