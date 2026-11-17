export type TrendPoint = { date: string; primary: number; secondary: number };

export function PerformanceChart({ points, primaryLabel = "Recipients", secondaryLabel = "Delivered" }: {
  points: TrendPoint[];
  primaryLabel?: string;
  secondaryLabel?: string;
}) {
  const max = Math.max(1, ...points.flatMap((point) => [point.primary, point.secondary]));
  const coordinates = (key: "primary" | "secondary") => points.map((point, index) => {
    const x = points.length < 2 ? 345 : (index / (points.length - 1)) * 690;
    const y = 165 - (point[key] / max) * 150;
    return [x, y] as const;
  });
  const makePath = (coords: readonly (readonly [number, number])[]) => coords.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const primary = coordinates("primary");
  const secondary = coordinates("secondary");
  const primaryPath = makePath(primary);
  const secondaryPath = makePath(secondary);
  const areaPath = primary.length ? `${primaryPath} L690 180 L0 180 Z` : "";
  const labels = points.filter((_, index) => index === 0 || index === points.length - 1 || index % Math.max(1, Math.ceil(points.length / 5)) === 0);

  if (!points.length || points.every((point) => point.primary === 0 && point.secondary === 0)) {
    return <div className="analytics-chart-empty">No campaign activity in this period.</div>;
  }
  return <>
    <div className="chart-wrap">
      <div className="chart-y"><span>{max.toLocaleString()}</span><span>{Math.round(max / 2).toLocaleString()}</span><span>0</span></div>
      <svg className="chart" viewBox="0 0 690 180" preserveAspectRatio="none" role="img" aria-label={`${primaryLabel} and ${secondaryLabel} by day`}>
        <defs><linearGradient id="analytics-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#6854d9" stopOpacity=".18" /><stop offset="100%" stopColor="#6854d9" stopOpacity="0" /></linearGradient></defs>
        <path d={areaPath} fill="url(#analytics-area)" />
        <path d={primaryPath} fill="none" stroke="#7460e7" strokeWidth="3" />
        <path d={secondaryPath} fill="none" stroke="#f3a36f" strokeWidth="2.4" strokeDasharray="5 5" />
      </svg>
    </div>
    <div className="chart-labels">{labels.map((point) => <span key={point.date}>{new Date(`${point.date}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "2-digit" })}</span>)}</div>
  </>;
}
