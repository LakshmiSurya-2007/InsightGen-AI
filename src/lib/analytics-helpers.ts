import type { DatasetSummary } from "@/lib/dataset-store";

type Row = Record<string, string | number | null>;

export function groupCount(rows: Row[], col: string, limit = 10): { name: string; value: number }[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const v = r[col];
    if (v === null || v === undefined || v === "") continue;
    const k = String(v);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return Array.from(m.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => ({ name, value }));
}

export function groupSum(rows: Row[], cat: string, num: string, limit = 10): { name: string; value: number }[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = r[cat]; const n = Number(r[num]);
    if (k === null || k === undefined || k === "") continue;
    if (!Number.isFinite(n)) continue;
    const key = String(k);
    m.set(key, (m.get(key) ?? 0) + n);
  }
  return Array.from(m.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
}

export function histogram(rows: Row[], col: string, bins = 10): { bin: string; count: number }[] {
  const values = rows.map((r) => Number(r[col])).filter((n) => Number.isFinite(n));
  if (values.length === 0) return [];
  const min = Math.min(...values), max = Math.max(...values);
  const width = (max - min) / bins || 1;
  const buckets = Array.from({ length: bins }, (_, i) => ({
    bin: `${(min + i * width).toFixed(1)}–${(min + (i + 1) * width).toFixed(1)}`,
    count: 0,
  }));
  for (const v of values) {
    const idx = Math.min(bins - 1, Math.floor((v - min) / width));
    buckets[idx].count++;
  }
  return buckets;
}

export function missingByColumn(d: DatasetSummary): { name: string; value: number }[] {
  return d.columns.map((c) => {
    let n = 0;
    for (const r of d.data) {
      const v = r[c];
      if (v === null || v === undefined || v === "") n++;
    }
    return { name: c, value: n };
  }).filter((x) => x.value > 0).sort((a, b) => b.value - a.value);
}
