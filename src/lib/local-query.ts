// Deterministic, TypeScript-only query engine for uploaded datasets.
// All numbers, aggregations and chart data are computed here — never by the LLM.
import type { DatasetSummary } from "./dataset-store";
import type { ChartSpec } from "./chart-renderer";

export type LocalAnswer = { text: string; charts: ChartSpec[] };

type Row = Record<string, string | number | null>;

const CHART_WORDS: Record<string, ChartSpec["type"]> = {
  bar: "bar",
  column: "bar",
  line: "line",
  trend: "line",
  area: "area",
  pie: "pie",
  donut: "pie",
  doughnut: "pie",
  scatter: "scatter",
  histogram: "histogram",
  distribution: "histogram",
};

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function findColumn(text: string, columns: string[]): string | null {
  const lower = text.toLowerCase();
  // Longest match first to prefer multi-word column names.
  const sorted = [...columns].sort((a, b) => b.length - a.length);
  for (const c of sorted) {
    const cl = c.toLowerCase();
    const re = new RegExp(`\\b${cl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
    if (re.test(lower)) return c;
  }
  return null;
}

function findColumns(text: string, columns: string[]): string[] {
  const hit = new Set<string>();
  const lower = text.toLowerCase();
  for (const c of [...columns].sort((a, b) => b.length - a.length)) {
    const cl = c.toLowerCase();
    const re = new RegExp(`\\b${cl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
    if (re.test(lower)) hit.add(c);
  }
  return [...hit];
}

function groupAggregate(
  data: Row[],
  groupCol: string,
  valueCol: string | null,
  op: "sum" | "avg" | "count" | "max" | "min",
): { key: string; value: number }[] {
  const buckets = new Map<string, number[]>();
  for (const r of data) {
    const k = String(r[groupCol] ?? "—");
    const list = buckets.get(k) ?? [];
    if (op === "count" || !valueCol) {
      list.push(1);
    } else {
      const n = toNum(r[valueCol]);
      if (n !== null) list.push(n);
    }
    buckets.set(k, list);
  }
  const out: { key: string; value: number }[] = [];
  for (const [k, vs] of buckets) {
    if (vs.length === 0) continue;
    let v: number;
    switch (op) {
      case "sum": v = vs.reduce((a, b) => a + b, 0); break;
      case "avg": v = vs.reduce((a, b) => a + b, 0) / vs.length; break;
      case "max": v = Math.max(...vs); break;
      case "min": v = Math.min(...vs); break;
      case "count": v = vs.length; break;
    }
    out.push({ key: k, value: Math.round(v * 100) / 100 });
  }
  return out;
}

function histogram(data: Row[], col: string, bins = 10): { bin: string; count: number }[] {
  const nums = data.map((r) => toNum(r[col])).filter((n): n is number => n !== null);
  if (nums.length === 0) return [];
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (min === max) return [{ bin: String(min), count: nums.length }];
  const w = (max - min) / bins;
  const out = Array.from({ length: bins }, (_, i) => ({
    bin: `${(min + i * w).toFixed(1)}–${(min + (i + 1) * w).toFixed(1)}`,
    count: 0,
  }));
  for (const n of nums) {
    let idx = Math.floor((n - min) / w);
    if (idx >= bins) idx = bins - 1;
    out[idx].count++;
  }
  return out;
}

function detectAggOp(text: string): "sum" | "avg" | "count" | "max" | "min" {
  const t = text.toLowerCase();
  if (/\b(avg|average|mean)\b/.test(t)) return "avg";
  if (/\b(count|frequency|how many)\b/.test(t)) return "count";
  if (/\b(max|maximum|highest|peak)\b/.test(t)) return "max";
  if (/\b(min|minimum|lowest)\b/.test(t)) return "min";
  return "sum";
}

function detectChartType(text: string): ChartSpec["type"] | null {
  const t = text.toLowerCase();
  for (const w of Object.keys(CHART_WORDS)) {
    if (new RegExp(`\\b${w}\\b`).test(t)) return CHART_WORDS[w];
  }
  if (/\bplot|chart|graph|visuali[sz]e|show me\b/.test(t)) return "bar";
  return null;
}

function fmtNum(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return String(Math.round(n * 100) / 100);
}

/** Try to answer the question from the dataset locally. Returns null on miss. */
export function tryLocalAnswer(query: string, d: DatasetSummary): LocalAnswer | null {
  const q = query.trim();
  if (!q) return null;
  const lq = q.toLowerCase();

  console.log("[InsightGen] local-query:", { dataset: d.name, rows: d.rows, cols: d.cols, query: q });

  // 1. Row count
  if (/\b(how many rows|row count|number of rows|how many records|total rows)\b/.test(lq)) {
    return { text: `The **${d.name}** dataset has **${d.rows.toLocaleString()} rows** and ${d.cols} columns.`, charts: [] };
  }

  // 2. Column count / list
  if (/\b(how many columns|number of columns|column count)\b/.test(lq)) {
    return { text: `The dataset has **${d.cols} columns**: ${d.columns.map((c) => `\`${c}\``).join(", ")}.`, charts: [] };
  }
  if (/\b(what columns|which columns|list (the )?columns|column names|show columns|columns are there)\b/.test(lq)) {
    const lines = [
      `**${d.columns.length} columns** in \`${d.name}\`:`,
      ...d.columns.map((c) => `- \`${c}\` ${d.numericCols.includes(c) ? "_(numeric)_" : "_(categorical)_"}`),
    ];
    return { text: lines.join("\n"), charts: [] };
  }

  // 3. Missing values
  if (/\b(missing|null|na values|data quality)\b/.test(lq)) {
    return { text: `There are **${d.missing.toLocaleString()} missing values** across ${d.cols} columns and ${d.rows.toLocaleString()} rows (≈ ${((d.missing / Math.max(1, d.rows * d.cols)) * 100).toFixed(2)}% of cells).`, charts: [] };
  }

  // 4. Describe / summarise
  if (/\b(describe|summary|summari[sz]e|overview|tell me about)\b.*\b(data|dataset)?\b/.test(lq) && !detectChartType(lq)) {
    const top = d.numericCols.slice(0, 5).map((c) => {
      const s = d.stats[c] ?? {};
      return `- \`${c}\`: min ${fmtNum(s.min ?? NaN)}, avg ${fmtNum(s.avg ?? NaN)}, max ${fmtNum(s.max ?? NaN)}`;
    });
    const text = [
      `**${d.name}** — ${d.rows.toLocaleString()} rows × ${d.cols} columns.`,
      `- Numeric columns (${d.numericCols.length}): ${d.numericCols.map((c) => `\`${c}\``).join(", ") || "none"}`,
      `- Categorical columns (${d.categoricalCols.length}): ${d.categoricalCols.map((c) => `\`${c}\``).join(", ") || "none"}`,
      `- Missing values: ${d.missing.toLocaleString()}`,
      top.length ? "\n**Numeric stats:**" : "",
      ...top,
    ].filter(Boolean).join("\n");
    return { text, charts: [] };
  }

  // 5. Single-column stats: "average of price", "max of sales"
  const opMatch = /\b(average|avg|mean|sum|total|max|maximum|min|minimum|count)\s+(of\s+)?/.exec(lq);
  if (opMatch && !detectChartType(lq)) {
    const col = findColumn(q, d.columns);
    if (col && d.numericCols.includes(col)) {
      const s = d.stats[col] ?? {};
      const op = detectAggOp(lq);
      let val: number | undefined;
      if (op === "avg") val = s.avg;
      else if (op === "max") val = s.max;
      else if (op === "min") val = s.min;
      else if (op === "sum") {
        const nums = d.data.map((r) => toNum(r[col])).filter((n): n is number => n !== null);
        val = nums.reduce((a, b) => a + b, 0);
      } else if (op === "count") {
        val = d.data.filter((r) => toNum(r[col]) !== null).length;
      }
      if (val !== undefined) return { text: `**${op}** of \`${col}\` = **${fmtNum(val)}**`, charts: [] };
    }
  }

  // 6. Chart requests
  const chartType = detectChartType(lq);
  if (chartType) {
    const cols = findColumns(q, d.columns);
    const byMatch = /\bby\s+([a-z0-9_ ]+)/i.exec(q);
    let groupCol: string | null = null;
    let valueCol: string | null = null;

    if (byMatch) {
      groupCol = findColumn(byMatch[1], d.columns);
      const other = cols.find((c) => c !== groupCol) ?? null;
      valueCol = other && d.numericCols.includes(other) ? other : null;
    } else if (chartType === "histogram") {
      valueCol = cols.find((c) => d.numericCols.includes(c)) ?? d.numericCols[0] ?? null;
    } else if (chartType === "pie") {
      groupCol = cols.find((c) => d.categoricalCols.includes(c)) ?? d.categoricalCols[0] ?? null;
      valueCol = cols.find((c) => d.numericCols.includes(c)) ?? null;
    } else {
      // Heuristics: first categorical = group, first numeric = value.
      groupCol = cols.find((c) => d.categoricalCols.includes(c)) ?? d.categoricalCols[0] ?? null;
      valueCol = cols.find((c) => d.numericCols.includes(c)) ?? d.numericCols[0] ?? null;
    }

    let spec: ChartSpec | null = null;

    if (chartType === "histogram") {
      if (!valueCol) return { text: `No numeric column found to build a histogram.`, charts: [] };
      const bins = histogram(d.data, valueCol);
      spec = { type: "histogram", title: `Distribution of ${valueCol}`, x: "bin", y: "count", data: bins };
    } else if (chartType === "scatter") {
      const xs = cols.filter((c) => d.numericCols.includes(c));
      const xc = xs[0] ?? d.numericCols[0];
      const yc = xs[1] ?? d.numericCols[1];
      if (!xc || !yc) return { text: `Need two numeric columns for a scatter plot.`, charts: [] };
      const data = d.data
        .map((r) => ({ [xc]: toNum(r[xc]) ?? 0, [yc]: toNum(r[yc]) ?? 0 }))
        .slice(0, 500);
      spec = { type: "scatter", title: `${yc} vs ${xc}`, x: xc, y: yc, data };
    } else {
      if (!groupCol) return { text: `Couldn't identify a category column for the chart. Available columns: ${d.columns.join(", ")}.`, charts: [] };
      const op = valueCol ? detectAggOp(lq) : "count";
      const agg = groupAggregate(d.data, groupCol, valueCol, op);
      const top = agg.sort((a, b) => b.value - a.value).slice(0, 25);
      const yKey = valueCol ? `${op} of ${valueCol}` : "count";
      const data = top.map((r) => ({ [groupCol!]: r.key, [yKey]: r.value }));
      const title = valueCol ? `${op} of ${valueCol} by ${groupCol}` : `count by ${groupCol}`;
      spec = { type: chartType, title, x: groupCol, y: yKey, data };
    }

    console.log("[InsightGen] generated chart:", spec);
    const summary = `Here is a **${chartType} chart** for \`${d.name}\`${spec.title ? ` — _${spec.title}_` : ""}. Computed from ${d.rows.toLocaleString()} rows.`;
    return { text: summary, charts: [spec] };
  }

  return null;
}
