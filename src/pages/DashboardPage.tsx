import {
  ArrowUpRight,
  Check,
  ContactRound,
  Mail,
  MessageCircle,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import type { Page } from "../models";
import { PageHeading, Stat } from "../components/Shared";
import { campaigns } from "../data/fixtures";
import { CampaignTable } from "../components/CampaignTable";
import { PerformanceChart } from "../components/PerformanceChart";

export function Dashboard({
  setPage,
  period,
  setPeriod,
}: {
  setPage: (p: Page) => void;
  period: string;
  setPeriod: (s: string) => void;
}) {
  return (
    <>
      <PageHeading
        eyebrow="THURSDAY, NOVEMBER 13, 2026 · SAMPLE DATA"
        title="Good morning, Amara 👋"
        desc="Here’s what’s happening with your audience today."
        action={
          <>
            <button
              className="btn secondary"
              onClick={() => setPage("Reports")}
            >
              <ArrowUpRight size={16} /> View reports
            </button>
            <button
              className="btn primary"
              onClick={() => setPage("Email campaigns")}
            >
              <Plus size={17} /> Create campaign
            </button>
          </>
        }
      />
      <div className="welcome-banner">
        <div className="welcome-orb orb1" />
        <div className="welcome-orb orb2" />
        <div className="welcome-copy">
          <div className="banner-label">
            <Sparkles size={14} /> YOUR CRM AT A GLANCE
          </div>
          <h2>
            Good relationships start with
            <br />
            the right conversation.
          </h2>
          <p>Reach the people who matter, with messages that do too.</p>
          <button onClick={() => setPage("Contacts")}>
            Explore your audience <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="banner-art">
          <div className="art-circle">
            <div className="art-inner">
              <Mail size={31} />
            </div>
            <span className="art-bubble bubble-a">
              <Users size={18} />
            </span>
            <span className="art-bubble bubble-b">
              <MessageSquareText size={17} />
            </span>
            <span className="art-bubble bubble-c">
              <Sparkles size={16} />
            </span>
          </div>
        </div>
      </div>
      <div className="section-row">
        <div>
          <h2 className="section-title">Your workspace</h2>
          <p className="section-subtitle">A snapshot of your CRM activity.</p>
        </div>
        <select
          className="period-select"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>Last 90 days</option>
        </select>
      </div>
      <div className="stats-grid">
        <Stat
          icon={<ContactRound />}
          label="Total contacts"
          value="2,486"
          change="12.8%"
          hint="vs last month"
          color="lav"
        />
        <Stat
          icon={<Send />}
          label="Campaigns sent"
          value="18"
          change="16.4%"
          hint="vs last month"
          color="blue"
        />
        <Stat
          icon={<Mail />}
          label="Emails delivered"
          value="24.8k"
          change="8.2%"
          hint="vs last month"
          color="orange"
        />
        <Stat
          icon={<MessageSquareText />}
          label="SMS sent"
          value="3,642"
          change="4.6%"
          hint="vs last month"
          color="green"
        />
      </div>
      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Campaign performance</h2>
              <p>Delivery and engagement over time</p>
            </div>
            <button className="icon-btn" onClick={() => setPage("Reports")}>
              <MoreHorizontal size={19} />
            </button>
          </div>
          <div className="chart-legend">
            <span>
              <i className="legend-dot violet-dot" />
              Delivered
            </span>
            <span>
              <i className="legend-dot orange-dot" />
              Engagement
            </span>
            <span className="chart-total">
              <b>28.4k</b>
              <small>messages delivered</small>
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
        <section className="panel channel-panel">
          <div className="panel-heading">
            <div>
              <h2>Channel overview</h2>
              <p>How your messages are performing</p>
            </div>
            <button className="icon-btn" onClick={() => setPage("Reports")}>
              <ArrowUpRight size={17} />
            </button>
          </div>
          <div className="channel-item">
            <div className="channel-icon mail-icon">
              <Mail size={19} />
            </div>
            <div className="channel-info">
              <b>Email</b>
              <small>24,820 delivered</small>
            </div>
            <div className="channel-rate">
              <b>98.4%</b>
              <small>delivery rate</small>
            </div>
          </div>
          <div className="channel-track">
            <span className="email-track" />
          </div>
          <div className="channel-item">
            <div className="channel-icon sms-icon">
              <MessageSquareText size={19} />
            </div>
            <div className="channel-info">
              <b>SMS</b>
              <small>3,642 delivered</small>
            </div>
            <div className="channel-rate">
              <b>96.8%</b>
              <small>delivery rate</small>
            </div>
          </div>
          <div className="channel-track">
            <span className="sms-track" />
          </div>
          <div className="channel-item">
            <div className="channel-icon whatsapp-icon">
              <MessageCircle size={19} />
            </div>
            <div className="channel-info">
              <b>WhatsApp</b>
              <small>1,196 delivered · sample</small>
            </div>
            <div className="channel-rate">
              <b>72.6%</b>
              <small>read rate</small>
            </div>
          </div>
          <div className="channel-track">
            <span className="whatsapp-track" />
          </div>
          <div className="channel-foot">
            <span>
              <i className="live-dot" />
              Sample provider status
            </span>
            <b>
              Illustrative <Check size={14} />
            </b>
          </div>
        </section>
      </div>
      <section className="panel recent-panel">
        <div className="panel-heading">
          <div>
            <h2>Recent campaigns</h2>
            <p>Your latest communication activity.</p>
          </div>
          <button
            className="text-link"
            onClick={() => setPage("Email campaigns")}
          >
            View all campaigns <ArrowUpRight size={14} />
          </button>
        </div>
        <CampaignTable rows={campaigns.slice(0, 3)} />
      </section>
    </>
  );
}
