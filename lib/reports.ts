import { inventoryDay } from "./inventory";
import { saoPauloTimestamp } from "./purchases";
// Reject absent/invalid totals and fractional cents rather than silently rounding.
export function moneyCents(value: unknown): bigint | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return;
  const scaled = value * 100;
  if (!Number.isSafeInteger(Math.round(scaled)) || Math.abs(scaled - Math.round(scaled)) > 0.00001) return;
  return BigInt(Math.round(scaled));
}
export function summarize(data: { status?: string; valorTotal?: number }[], statuses: string[]) {
  return [...new Set([...statuses, ...data.map(r => r.status || "SEM_STATUS")])].map(status => {
    const rows = data.filter(r => (r.status || "SEM_STATUS") === status);
    let cents = 0n, missing = 0;
    for (const row of rows) { const value = moneyCents(row.valorTotal); if (value === undefined) missing++; else cents += value; }
    return { status, count: rows.length, cents, missing };
  });
}
export function centsLabel(value: bigint) {
  return `R$ ${(value / 100n).toLocaleString("pt-BR")},${String(value % 100n).padStart(2, "0")}`;
}
export function periodDates(period = "mes", now = new Date()) {
  const today = inventoryDay(now.toISOString());
  if (period === "30dias") {
    const day = new Date(`${today}T12:00:00Z`); day.setUTCDate(day.getUTCDate() - 29);
    return { inicio: day.toISOString().slice(0,10), fim: today };
  }
  const [year, month] = today.split("-").map(Number);
  return { inicio: `${today.slice(0,7)}-01`, fim: new Date(Date.UTC(year, month, 0)).toISOString().slice(0,10) };
}
export function isoTimestamp(value?: string) {
  if (!value || !inventoryDay(value)) return "";
  // Keep explicit offsets (and fractional seconds); resolve offsetless backend wall time.
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(value)) return value.replace(/[zZ]$/, "+00:00");
  try {
    const fraction = value.match(/\.\d+/)?.[0] || "";
    const resolved = saoPauloTimestamp(value.replace(/\.\d+/, ""));
    return resolved.replace(/([+-]\d{2}:\d{2})$/, `${fraction}$1`);
  } catch { return ""; }
}
export type CsvCell = string | number | { numeric: string } | undefined | null;
export function csvNumber(value: number | undefined, decimals?: number): CsvCell {
  return value === undefined || !Number.isFinite(value) ? "" : { numeric: value.toLocaleString("pt-BR", { useGrouping: false, minimumFractionDigits: decimals, maximumFractionDigits: decimals ?? 20 }) };
}
function csvCell(value: CsvCell) {
  const trusted = typeof value === "number" || (typeof value === "object" && value !== null);
  let text = typeof value === "object" && value !== null ? value.numeric : typeof value === "number" ? (Number.isFinite(value) ? value.toLocaleString("pt-BR", { useGrouping: false, maximumFractionDigits: 20 }) : "") : String(value ?? "");
  if (!trusted && /^[\s\u0000-\u001f]*[=+\-@]/u.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function createCsv(headers: string[], rows: CsvCell[][]) {
  return "\uFEFF" + [headers, ...rows].map(row => row.map(csvCell).join(";")).join("\r\n") + "\r\n";
}
export function downloadCsv(name: string, headers: string[], rows: CsvCell[][]) {
  const url = URL.createObjectURL(new Blob([createCsv(headers, rows)], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = `vila-verde-${name}-${inventoryDay(new Date().toISOString())}.csv`;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function validDateRange(start: string, end: string) {
  return [start, end].every(v => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v) && start <= end;
}
