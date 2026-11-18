/** Quote CSV values and neutralize cells that spreadsheet apps may execute. */
export function csvCell(value: unknown) {
  const text = String(value ?? "");
  const safe = /^[\s\u0000-\u001f]*[=+\-@]/u.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}
