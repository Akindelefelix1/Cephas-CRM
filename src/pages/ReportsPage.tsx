import {
  ArrowUpRight,
  CheckCheck,
  Download,
  Mail,
  MessageCircle,
  MessageSquareText,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { Page } from "../models";
import { PageHeading, Stat } from "../components/Shared";
import { campaigns } from "../data/fixtures";
import { CampaignTable } from "../components/CampaignTable";
import { PerformanceChart } from "../components/PerformanceChart";

export function ReportsDashboard({
  period,
  setPeriod,
  setPage,
}: {
  period: string;
  setPeriod: (s: string) => void;
  setPage: (p: Page) => void;
}) {
  const exportReport = () => {
    const csv = [
      "Metric,Value,Period",
      "Messages sent,28462,Sample",
      "Delivered,27948,Sample",
      "Unique clicks,1842,Sample",
      "Unsubscribes,24,Sample",
      ...campaigns.map((c) => `${c.name},${c.reach},${c.date}`),
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "cephas-sample-report.csv";
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <>
      <PageHeading
        eyebrow="SAMPLE REPORT · ILLUSTRATIVE METRICS"
        title="Reports & analytics"
        desc="Understand what resonates and make your next campaign even better."
        action={
          <>
            <select
              className="period-select"
              aria-label="Report period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
            <button className="btn secondary" onClick={exportReport}>
              <Download size={16} /> Export CSV
            </button>
          </>
        }
      />
      <div className="stats-grid compact-stats">
        <Stat
          icon={<Send />}
          label="Messages sent"
          value="28,462"
          change="Sample"
          hint={period}
          color="lav"
        />
        <Stat
          icon={<CheckCheck />}
          label="Delivered"
          value="27,948"
          change="Sample"
          hint="illustrative data"
          color="green"
        />
        <Stat
          icon={<TrendingUp />}
          label="Unique clicks"
          value="1,842"
          change="Sample"
          hint="illustrative data"
          color="blue"
        />
        <Stat
          icon={<ShieldCheck />}
          label="Unsubscribes"
          value="24"
          change="Sample"
          hint="illustrative data"
          color="orange"
        />
      </div>
      <div className="report-grid">
        <section className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Delivery & engagement</h2>
              <p>Illustrative trend · {period}</p>
            </div>
          </div>
          <div className="chart-legend">
            <span>
              <i className="legend-dot violet-dot" />
              Delivered
            </span>
            <span>
              <i className="legend-dot orange-dot" />
              Clicks
            </span>
          </div>
          <PerformanceChart />
          <div className="chart-labels">
            <span>Oct 15</span>
            <span>Oct 20</span>
            <span>Oct 25</span>
            <span>Oct 30</span>
            <span>Nov 04</span>
            <span>Nov 09</span>
            <span>Nov 13</span>
          </div>
        </section>
        <section className="panel report-side">
          <div className="panel-heading">
            <div>
              <h2>Channel performance</h2>
              <p>Sample delivery rates</p>
            </div>
          </div>
          <div className="report-channel">
            <span className="channel-icon mail-icon">
              <Mail size={17} />
            </span>
            <div>
              <b>Email</b>
              <small>24,820 sent · sample</small>
            </div>
            <strong>98.4%</strong>
          </div>
          <div className="report-bar">
            <i style={{ width: "98.4%" }} />
          </div>
          <div className="report-channel">
            <span className="channel-icon sms-icon">
              <MessageSquareText size={17} />
            </span>
            <div>
              <b>SMS</b>
              <small>3,642 sent · sample</small>
            </div>
            <strong>96.8%</strong>
          </div>
          <div className="report-bar sms-bar">
            <i style={{ width: "96.8%" }} />
          </div>
          <div className="report-channel">
            <span className="channel-icon whatsapp-icon">
              <MessageCircle size={17} />
            </span>
            <div>
              <b>WhatsApp</b>
              <small>1,248 sent · sample</small>
            </div>
            <strong>72.6%</strong>
          </div>
          <div className="report-bar whatsapp-bar">
            <i style={{ width: "72.6%" }} />
          </div>
          <div className="report-insight">
            <Sparkles size={16} />
            <span>
              Delivery rates are examples only and are not connected to a live
              provider.
            </span>
          </div>
        </section>
      </div>
      <section className="panel recent-panel">
        <div className="panel-heading">
          <div>
            <h2>Campaign performance</h2>
            <p>Illustrative results across recent sample sends.</p>
          </div>
          <button
            className="text-link"
            onClick={() => setPage("Email campaigns")}
          >
            View campaigns <ArrowUpRight size={14} />
          </button>
        </div>
        <CampaignTable rows={campaigns} />
      </section>
      <p className="compliance-note">
        <i className="info-dot">i</i> Email opens are estimates and may be
        inflated or unavailable due to privacy features. Clicks and conversions
        are stronger engagement signals.
      </p>
    </>
  );
}
