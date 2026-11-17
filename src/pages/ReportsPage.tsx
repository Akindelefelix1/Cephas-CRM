import { ArrowUpRight, CheckCheck, Download, Mail, MessageCircle, MessageSquareText, ShieldCheck, TrendingUp, Users } from "lucide-react";
import type { ApiAnalytics } from "../api";
import type { Campaign, Page } from "../models";
import { PageHeading, Stat } from "../components/Shared";
import { CampaignTable } from "../components/CampaignTable";
import { PerformanceChart } from "../components/PerformanceChart";

const number = (value: number) => new Intl.NumberFormat().format(value);
const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export function ReportsDashboard({ period, setPeriod, setPage, analytics, loading, error, retry, campaigns }: {
  period: string; setPeriod: (s: string) => void; setPage: (p: Page) => void; analytics: ApiAnalytics | null; loading: boolean; error: string; retry: () => void; campaigns: Campaign[];
}) {
  const exportReport = () => {
    if (!analytics) return;
    const rows = [
      ["Metric", "Value", "Period"],
      ["Total contacts", analytics.summary.contactsTotal, period],
      ["Contacts added", analytics.summary.contactsAdded, period],
      ["Campaigns sent", analytics.summary.campaignsSent, period],
      ["Recipients", analytics.summary.recipients, period],
      ["Provider accepted", analytics.summary.providerAccepted, period],
      ["WhatsApp delivered", analytics.summary.whatsappDelivered, period],
      ["Failed recipients", analytics.summary.failed, period],
      ...analytics.channels.map((channel) => [`${channel.channel} recipients`, channel.recipients, period]),
      ["Email subscribed contacts", analytics.consent.email, period],
      ["SMS subscribed contacts", analytics.consent.sms, period],
      ["WhatsApp subscribed contacts", analytics.consent.whatsapp, period],
      ...analytics.campaignStatuses.map((item) => [`Campaign status: ${item.status}`, item.count, "All time"]),
      ...analytics.trends.map((point) => [point.date, point.recipients, "Recipients"]),
    ].map((row) => row.map(csvCell).join(","));
    const url = URL.createObjectURL(new Blob([`\uFEFF${rows.join("\r\n")}`], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `cephas-report-${analytics.range.days}-days.csv`; a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <>
    <PageHeading eyebrow="WORKSPACE ANALYTICS" title="Reports & analytics" desc="Understand your saved campaign and audience activity." action={<><select className="period-select" aria-label="Report period" value={period} onChange={(e) => setPeriod(e.target.value)}><option>Last 7 days</option><option>Last 30 days</option><option>Last 90 days</option></select><button className="btn secondary" onClick={exportReport} disabled={!analytics || loading}><Download size={16} /> Export CSV</button></>} />
    {error ? <div className="analytics-state error" role="alert"><b>Could not load reports</b><span>{error}</span><button className="btn secondary" onClick={retry}>Retry</button></div> : loading && !analytics ? <div className="analytics-state" role="status">Loading reports from the CRM API…</div> : analytics ? <>
      <div className="stats-grid compact-stats"><Stat icon={<Users />} label="Contacts added" value={number(analytics.summary.contactsAdded)} change="API" hint={period} color="lav" /><Stat icon={<CheckCheck />} label="WhatsApp delivered" value={number(analytics.summary.whatsappDelivered)} change="API" hint="provider tracked" color="green" /><Stat icon={<TrendingUp />} label="Recipients" value={number(analytics.summary.recipients)} change="API" hint="sent campaigns" color="blue" /><Stat icon={<ShieldCheck />} label="Failed recipients" value={number(analytics.summary.failed)} change="API" hint="tracked send failures" color="orange" /></div>
      <div className="report-grid"><section className="panel chart-panel"><div className="panel-heading"><div><h2>Campaign activity</h2><p>Daily recipients and confirmed WhatsApp deliveries · {period}</p></div></div><div className="chart-legend"><span><i className="legend-dot violet-dot" />Recipients</span><span><i className="legend-dot orange-dot" />WhatsApp delivered</span></div><PerformanceChart points={analytics.trends.map((point) => ({ date: point.date, primary: point.recipients, secondary: point.delivered }))} primaryLabel="Recipients" secondaryLabel="WhatsApp delivered" /></section>
      <section className="panel report-side"><div className="panel-heading"><div><h2>Channel performance</h2><p>Actual campaign records for this period</p></div></div>{analytics.channels.map((channel) => { const isEmail = channel.channel === "Email"; const isSms = channel.channel === "SMS"; const Icon = isEmail ? Mail : isSms ? MessageSquareText : MessageCircle; const tone = isEmail ? "mail-icon" : isSms ? "sms-icon" : "whatsapp-icon"; const percent = channel.deliveryRate; return <div key={channel.channel}><div className="report-channel"><span className={`channel-icon ${tone}`}><Icon size={17} /></span><div><b>{channel.channel}</b><small>{number(channel.recipients)} recipients · {number(channel.campaignsSent)} campaigns</small></div><strong>{percent === null ? "—" : `${percent}%`}</strong></div><div className={`report-bar ${isSms ? "sms-bar" : isEmail ? "" : "whatsapp-bar"}`}><i style={{ width: `${percent ?? 0}%` }} /></div>{!channel.deliveryTrackingAvailable && <small className="tracking-note">Provider delivery tracking unavailable</small>}</div>; })}<div className="report-insight"><ShieldCheck size={16} /><span>Email opens, clicks, and unsubscribes are not synchronized, so they are omitted from these live metrics.</span></div></section></div>
      <div className="report-grid report-detail-grid"><section className="panel report-side"><div className="panel-heading"><div><h2>Audience consent</h2><p>Currently subscribed contacts</p></div></div>{([ ["Email", analytics.consent.email, Mail], ["SMS", analytics.consent.sms, MessageSquareText], ["WhatsApp", analytics.consent.whatsapp, MessageCircle] ] as const).map(([label, count, Icon]) => <div className="report-channel" key={label}><span className="channel-icon mail-icon"><Icon size={17} /></span><div><b>{label} opted in</b><small>Subscribed contacts</small></div><strong>{number(count)}</strong></div>)}</section><section className="panel report-side"><div className="panel-heading"><div><h2>Campaign status</h2><p>All saved campaign records</p></div></div>{analytics.campaignStatuses.length ? analytics.campaignStatuses.map((item) => <div className="report-channel" key={item.status}><span className="campaign-status-dot" /><div><b>{item.status}</b></div><strong>{number(item.count)}</strong></div>) : <div className="analytics-chart-empty">No campaigns have been saved yet.</div>}</section></div>
      <section className="panel recent-panel"><div className="panel-heading"><div><h2>Campaign activity</h2><p>Recent campaigns saved in your workspace.</p></div><button className="text-link" onClick={() => setPage("Email campaigns")}>View campaigns <ArrowUpRight size={14} /></button></div>{campaigns.length ? <CampaignTable rows={campaigns.slice(0, 10)} /> : <div className="analytics-chart-empty">No campaigns have been saved yet.</div>}</section>
      <p className="compliance-note"><i className="info-dot">i</i> Recipients represent saved campaign recipient counts. Provider acceptance and confirmed delivery are shown separately where the provider supplies tracking data.</p>
      <p className="analytics-updated">Last updated {new Date(analytics.generatedAt).toLocaleString()}</p>
    </> : <div className="analytics-state">No report data is available.</div>}
  </>;
}

