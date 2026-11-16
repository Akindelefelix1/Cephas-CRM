import { Bell, ChevronLeft, Layers3 } from "lucide-react";
import { Badge, PageHeading } from "../components/Shared";

export function NotificationsPage({ onBack }: { onBack: () => void }) {
  return (
    <>
      <PageHeading
        eyebrow="WORKSPACE UPDATES"
        title="Notifications"
        desc="Approvals and important workspace activity will appear here."
        action={
          <button className="btn secondary" onClick={onBack}>
            <ChevronLeft size={16} /> Back to dashboard
          </button>
        }
      />
      <div className="panel notification-empty">
        <div>
          <Bell size={20} />
        </div>
        <h2>You’re all caught up</h2>
        <p>There are no new notifications in this preview.</p>
      </div>
    </>
  );
}
export function ComingSoon() {
  return (
    <>
      <PageHeading
        eyebrow="ON THE ROADMAP"
        title="Lead management"
        desc="Keep track of prospects and opportunities as your CRM grows."
      />
      <section className="panel coming-card">
        <div className="coming-icon">
          <Layers3 size={24} />
        </div>
        <Badge tone="Dynamic">Coming in a later release</Badge>
        <h2>Turn new interest into lasting relationships.</h2>
        <p>
          Lead stages, follow-up reminders, task assignment and a configurable
          sales pipeline are planned for a future release.
        </p>
        <div className="coming-roadmap">
          <span>
            <i className="roadmap-done" />
            Contact management
          </span>
          <span>
            <i className="roadmap-done" />
            Email & SMS campaigns
          </span>
          <span>
            <i className="roadmap-current" />
            Lead management
          </span>
          <span>
            <i />
            Automation & integrations
          </span>
        </div>
      </section>
    </>
  );
}
