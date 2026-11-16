import { ArrowUpRight } from "lucide-react";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return (
    <span className={`badge ${tone.toLowerCase().replace(" ", "-")}`}>
      {children}
    </span>
  );
}
export const deletePhraseMatches = (value: string) =>
  value.trim().toLocaleUpperCase() === "DELETE";

export function DeletePhraseInput({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="typed-delete-field">
      <span>
        Type <b>DELETE</b> to confirm
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="DELETE"
        autoComplete="off"
        aria-label="Type DELETE to confirm deletion"
        disabled={disabled}
      />
    </label>
  );
}

export function PageHeading({
  eyebrow,
  title,
  desc,
  action,
}: {
  eyebrow: string;
  title: string;
  desc: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-desc">{desc}</p>
      </div>
      <div className="heading-actions">{action}</div>
    </div>
  );
}
export function Stat({
  icon,
  label,
  value,
  change,
  hint,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  hint: string;
  color: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <div className={`stat-icon ${color}`}>{icon}</div>
        <span className={change === "Manage" ? "manage-link" : "stat-change"}>
          {change !== "Manage" && <ArrowUpRight size={13} />}
          {change}
        </span>
      </div>
      <p>{label}</p>
      <div className="stat-bottom">
        <strong>{value}</strong>
        <small>{hint}</small>
      </div>
    </div>
  );
}
