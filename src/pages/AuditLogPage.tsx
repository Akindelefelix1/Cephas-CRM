import { useEffect, useState } from "react";
import { ArrowDownToLine, ChevronLeft, ChevronRight, Search, ShieldCheck } from "lucide-react";
import { crmApi, type ApiAuditEvent } from "../api";
import { Badge, PageHeading } from "../components/Shared";
import { csvCell } from "../utils/csv";

const PAGE_SIZE = 25;
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
const colorFor = (eventType: string) => {
  const type = eventType.toLowerCase();
  return type.includes("approv") || type.includes("sent") ? "green" : type.includes("export") ? "orange" : type.includes("contact") ? "blue" : "violet";
};

export function AuditLogPreview({ notify, recordAudit, reloadKey }: {
  notify: (message: string, kind?: "success" | "error" | "loading") => void;
  recordAudit: (activity: string, details: string, eventType: string) => void;
  reloadKey: number;
}) {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [kind, setKind] = useState("All activity");
  const [offset, setOffset] = useState(0);
  const [result, setResult] = useState<{ items: ApiAuditEvent[]; total: number; eventTypes: string[] }>({ items: [], total: 0, eventTypes: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [expandedDetailId, setExpandedDetailId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearchTerm(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    crmApi.listAuditEvents({ search: searchTerm, eventType: kind, limit: PAGE_SIZE, offset })
      .then((response) => {
        if (active) setResult({ items: response.items, total: response.total, eventTypes: response.eventTypes });
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : "Could not load audit events from the CRM API.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [searchTerm, kind, offset, reloadKey, retryKey]);

  const exportLog = () => {
    const csv = [
      ["User", "Email", "Activity", "Details", "Event type", "Date and time"].map(csvCell).join(","),
      ...result.items.map((event) => [event.actorName, event.actorEmail ?? "", event.action, event.details, event.eventType, event.createdAt].map(csvCell).join(",")),
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `cephas-audit-events-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    recordAudit("Exported audit log", `${result.items.length} visible events`, "Data export");
    notify(`${result.items.length} audit events exported`);
  };

  const first = result.total === 0 ? 0 : offset + 1;
  const last = Math.min(offset + result.items.length, result.total);
  const maxOffset = Math.max(0, Math.floor((result.total - 1) / PAGE_SIZE) * PAGE_SIZE);

  return <>
    <PageHeading eyebrow="PERSISTENT ACTIVITY Â· AUDIT TRAIL" title="Audit log" desc="Review recorded CRM actions with an actor, event type and timestamp." action={<button className="btn secondary" onClick={exportLog} disabled={loading || result.items.length === 0}><ArrowDownToLine size={16} /> Export visible events</button>} />
    <div className="audit-callout"><div className="audit-shield"><ShieldCheck size={21} /></div><div><b>Workspace activity history</b><p>Events are saved by the CRM API and associated with the signed-in account.</p></div><Badge tone="neutral">API records</Badge></div>
    <section className="panel table-panel audit-panel">
      <div className="panel-heading"><div><h2>Activity <span className="light-count">{loading ? "Loading" : `${result.total} total`}</span></h2><p>Search, filter, and export the visible audit events.</p></div><div className="audit-filters"><div className="search-input"><Search size={15} /><input aria-label="Search audit events" value={query} onChange={(event) => { setQuery(event.target.value); setOffset(0); }} placeholder="Search events" /></div><select aria-label="Filter audit event type" value={kind} onChange={(event) => { setKind(event.target.value); setOffset(0); }}><option>All activity</option>{result.eventTypes.map((value) => <option key={value}>{value}</option>)}</select></div></div>
      {error ? <div className="analytics-state error" role="alert"><b>Could not load audit events</b><span>{error}</span><button className="btn secondary" onClick={() => setRetryKey((value) => value + 1)}>Retry</button></div> : <div className="table-scroll"><table className="audit-table"><thead><tr><th>USER</th><th>ACTIVITY</th><th>DETAILS</th><th>EVENT TYPE</th><th>DATE &amp; TIME</th></tr></thead><tbody>{result.items.map((event) => <tr key={event.id}><td><div className="contact-cell"><div className={`avatar ${["lavender", "peach", "mint", "blue", "pink", "yellow"][event.id.charCodeAt(0) % 6]}`}>{initials(event.actorName)}</div><div><b>{event.actorName}</b><small>{event.actorEmail ?? "Account"}</small></div></div></td><td><span className="audit-action"><i className={`event-dot ${colorFor(event.eventType)}`} />{event.action}</span></td><td><button type="button" className={`audit-detail ${expandedDetailId === event.id ? "expanded" : ""}`} aria-expanded={expandedDetailId === event.id} title={event.details || "No additional details"} onClick={() => setExpandedDetailId((id) => id === event.id ? null : event.id)}>{event.details || "â€”"}</button></td><td><Badge tone="neutral">{event.eventType}</Badge></td><td><time dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleString()}</time></td></tr>)}</tbody></table>
        {loading && <div className="analytics-state" role="status">Loading audit eventsâ€¦</div>}
        {!loading && result.items.length === 0 && <div className="empty-state"><Search size={20} /><b>{searchTerm || kind !== "All activity" ? "No activity matches this filter" : "No audit events yet"}</b><span>{searchTerm || kind !== "All activity" ? "Try another search term or event type." : "CRM activity will appear here as events are recorded."}</span>{(searchTerm || kind !== "All activity") && <button className="btn secondary" onClick={() => { setQuery(""); setKind("All activity"); setOffset(0); }}>Clear filters</button>}</div>}
      </div>}
      <div className="table-footer"><span>Showing <b>{first}â€“{last}</b> of {result.total} events</span><div className="audit-pagination"><button className="icon-btn" aria-label="Previous audit page" disabled={loading || offset === 0} onClick={() => setOffset((value) => Math.max(0, value - PAGE_SIZE))}><ChevronLeft size={17} /></button><button className="icon-btn" aria-label="Next audit page" disabled={loading || offset >= maxOffset} onClick={() => setOffset((value) => Math.min(maxOffset, value + PAGE_SIZE))}><ChevronRight size={17} /></button></div></div>
    </section>
    <p className="compliance-note"><ShieldCheck size={16} /> Audit events are retained in the CRM database and are visible only to the account that created them.</p>
  </>;
}
