// Supabase-backed dataset store. Datasets are persisted per user and
// the most recently used one is cached in sessionStorage for quick access.
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type DatasetRow = Database["public"]["Tables"]["datasets"]["Row"];
type Row = Record<string, string | number | null>;

export interface DatasetSummary {
  id?: string;
  name: string;
  rows: number;
  cols: number;
  numericCols: string[];
  categoricalCols: string[];
  missing: number;
  columns: string[];
  preview: Row[];
  data: Row[];
  stats: Record<string, { min?: number; max?: number; avg?: number }>;
  createdAt?: string;
}

const ACTIVE_KEY = "insightgen:active_dataset_id";

export function setActiveDatasetId(id: string | null) {
  try {
    if (id) sessionStorage.setItem(ACTIVE_KEY, id);
    else sessionStorage.removeItem(ACTIVE_KEY);
  } catch {
    // sessionStorage not available in current environment
  }
}

export function getActiveDatasetId(): string | null {
  try { return sessionStorage.getItem(ACTIVE_KEY); } catch { return null; }
}

export function summarize(name: string, rows: Row[]): DatasetSummary {
  const columns = rows.length ? Object.keys(rows[0]) : [];
  const numericCols: string[] = [];
  const categoricalCols: string[] = [];
  const stats: DatasetSummary["stats"] = {};
  let missing = 0;

  for (const col of columns) {
    let isNumeric = true;
    let min = Infinity, max = -Infinity, sum = 0, count = 0;
    for (const r of rows) {
      const v = r[col];
      if (v === null || v === undefined || v === "") { missing++; continue; }
      const n = typeof v === "number" ? v : Number(v);
      if (Number.isFinite(n) && typeof v !== "boolean") {
        if (n < min) min = n;
        if (n > max) max = n;
        sum += n; count++;
      } else {
        isNumeric = false;
      }
    }
    if (isNumeric && count > 0) {
      numericCols.push(col);
      stats[col] = { min, max, avg: sum / count };
    } else {
      categoricalCols.push(col);
    }
  }

  return {
    name,
    rows: rows.length,
    cols: columns.length,
    numericCols,
    categoricalCols,
    missing,
    columns,
    preview: rows.slice(0, 50),
    data: rows,
    stats,
  };
}

export async function saveDataset(d: DatasetSummary): Promise<DatasetSummary> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("datasets")
    .insert({
      user_id: userData.user.id,
      name: d.name,
      row_count: d.rows,
      col_count: d.cols,
      columns: d.columns,
      numeric_cols: d.numericCols,
      categorical_cols: d.categoricalCols,
      missing: d.missing,
      stats: d.stats,
      data: d.data,
    })
    .select()
    .single();

  if (error) throw error;
  setActiveDatasetId(data.id);
  return { ...d, id: data.id, createdAt: data.created_at };
}

export async function listDatasets(): Promise<DatasetSummary[]> {
  const { data, error } = await supabase
    .from("datasets")
    .select("id,name,row_count,col_count,columns,numeric_cols,categorical_cols,missing,stats,created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToSummaryMeta);
}

export async function loadDataset(id?: string | null): Promise<DatasetSummary | null> {
  const targetId = id ?? getActiveDatasetId();
  if (!targetId) return null;
  const { data, error } = await supabase
    .from("datasets")
    .select("*")
    .eq("id", targetId)
    .maybeSingle();
  if (error || !data) return null;
  const rows = (data.data as Row[]) ?? [];
  return {
    id: data.id,
    name: data.name,
    rows: data.row_count,
    cols: data.col_count,
    columns: data.columns as string[],
    numericCols: data.numeric_cols as string[],
    categoricalCols: data.categorical_cols as string[],
    missing: data.missing,
    stats: data.stats as DatasetSummary["stats"],
    data: rows,
    preview: rows.slice(0, 50),
    createdAt: data.created_at,
  };
}

export async function deleteDataset(id: string) {
  const { error } = await supabase.from("datasets").delete().eq("id", id);
  if (error) throw error;
  if (getActiveDatasetId() === id) setActiveDatasetId(null);
}

function rowToSummaryMeta(r: Partial<DatasetRow> & { id: string; name: string }): DatasetSummary {
  return {
    id: r.id,
    name: r.name,
    rows: r.row_count ?? 0,
    cols: r.col_count ?? 0,
    columns: (r.columns as string[]) ?? [],
    numericCols: (r.numeric_cols as string[]) ?? [],
    categoricalCols: (r.categorical_cols as string[]) ?? [],
    missing: r.missing ?? 0,
    stats: (r.stats as DatasetSummary["stats"]) ?? {},
    data: [],
    preview: [],
    createdAt: r.created_at,
  };
}
