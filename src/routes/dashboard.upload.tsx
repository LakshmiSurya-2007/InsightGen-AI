import { createFileRoute, Link } from "@tanstack/react-router";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";
import { Upload as UploadIcon, FileSpreadsheet, CheckCircle2, X, Loader2, Trash2 } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  summarize, saveDataset, listDatasets, loadDataset, deleteDataset,
  setActiveDatasetId, getActiveDatasetId, type DatasetSummary,
} from "@/lib/dataset-store";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/upload")({ component: UploadPage });

function UploadPage() {
  const [dataset, setDataset] = useState<DatasetSummary | null>(null);
  const [list, setList] = useState<DatasetSummary[]>([]);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [active, all] = await Promise.all([loadDataset(), listDatasets()]);
    setDataset(active);
    setList(all);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setBusy(true);
    try {
      const name = file.name;
      const ext = name.split(".").pop()?.toLowerCase();
      let rows: Record<string, string | number | null>[] = [];

      if (ext === "csv") {
        const text = await file.text();
        const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true, dynamicTyping: true });
        rows = parsed.data as never;
      } else if (ext === "xlsx" || ext === "xls") {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet, { defval: null }) as never;
      } else {
        setError("Please upload a .csv or .xlsx file.");
        return;
      }

      if (rows.length === 0) { setError("File contains no rows."); return; }

      const summary = summarize(name, rows);
      const saved = await saveDataset(summary);
      toast.success(`${name} uploaded and ready`);
      setDataset(saved);
      await refresh();
    } catch (e) {
      setError((e as Error).message || "Could not parse file");
      toast.error("Upload failed");
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const activate = async (id: string) => {
    setActiveDatasetId(id);
    setDataset(await loadDataset(id));
    toast.success("Dataset activated");
  };

  const remove = async (id: string) => {
    await deleteDataset(id);
    toast.success("Dataset removed");
    await refresh();
    if (getActiveDatasetId() === null) setDataset(null);
  };

  return (
    <>
      <Topbar title="Datasets" subtitle="Upload CSV or Excel. Only you can see your data." />
      <div className="p-4 md:p-6 space-y-6">
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault(); setDrag(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          className={`glass rounded-3xl border-2 border-dashed transition-all ${drag ? "border-primary ring-glow" : "border-border"} p-8 md:p-12 text-center`}
        >
          <div className="grid place-items-center w-16 h-16 mx-auto rounded-2xl gradient-primary shadow-glow mb-4">
            {busy ? <Loader2 className="w-7 h-7 text-primary-foreground animate-spin" /> : <UploadIcon className="w-7 h-7 text-primary-foreground" />}
          </div>
          <h3 className="text-lg font-semibold">{busy ? "Uploading..." : "Drop your dataset here"}</h3>
          <p className="text-sm text-muted-foreground mt-1">Supported: .csv, .xlsx — uploads are private to your account.</p>
          <div className="mt-6">
            <label className="inline-flex">
              <input
                type="file" accept=".csv,.xlsx,.xls" className="hidden" disabled={busy}
                onChange={(e) => e.target.files && handleFile(e.target.files[0])}
              />
              <Button asChild disabled={busy} className="gradient-primary text-primary-foreground border-0 shadow-glow">
                <span>Browse files</span>
              </Button>
            </label>
          </div>
          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        </div>

        {dataset && (
          <>
            <div className="glass rounded-2xl p-5 flex flex-wrap items-center gap-4">
              <div className="grid place-items-center w-12 h-12 rounded-xl bg-primary/15 text-primary">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{dataset.name}</h3>
                  <CheckCircle2 className="w-4 h-4 text-chart-3" />
                  <span className="text-[10px] uppercase tracking-wider text-primary">Active</span>
                </div>
                <p className="text-xs text-muted-foreground">{dataset.rows} rows · {dataset.cols} columns · {dataset.missing} missing values{dataset.createdAt ? ` · uploaded ${new Date(dataset.createdAt).toLocaleString()}` : ""}</p>
              </div>
              <Link to="/dashboard/assistant"><Button className="gradient-primary text-primary-foreground border-0">Ask AI</Button></Link>
              <Link to="/dashboard/analytics"><Button variant="outline">Open analytics</Button></Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Stat label="Rows" value={dataset.rows.toLocaleString()} />
              <Stat label="Columns" value={dataset.cols.toString()} />
              <Stat label="Numeric" value={dataset.numericCols.length.toString()} />
              <Stat label="Categorical" value={dataset.categoricalCols.length.toString()} />
              <Stat label="Missing" value={dataset.missing.toLocaleString()} />
            </div>

            <div className="glass rounded-2xl p-5 shadow-elegant">
              <h3 className="text-sm font-semibold mb-3">Preview</h3>
              <div className="overflow-auto rounded-lg border border-border max-h-96">
                <table className="min-w-full text-xs">
                  <thead className="bg-secondary/60 sticky top-0">
                    <tr>{dataset.columns.map((c) => <th key={c} className="text-left px-3 py-2 font-medium whitespace-nowrap">{c}</th>)}</tr>
                  </thead>
                  <tbody>
                    {dataset.preview.slice(0, 25).map((r, i) => (
                      <tr key={i} className="border-t border-border hover:bg-secondary/30">
                        {dataset.columns.map((c) => (
                          <td key={c} className="px-3 py-2 text-muted-foreground whitespace-nowrap">{String(r[c] ?? "—")}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {list.length > 0 && (
          <div className="glass rounded-2xl p-5 shadow-elegant">
            <h3 className="text-sm font-semibold mb-3">Your datasets</h3>
            <ul className="divide-y divide-border">
              {list.map((d) => (
                <li key={d.id} className="flex items-center gap-3 py-3 text-sm">
                  <FileSpreadsheet className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{d.name}</div>
                    <div className="text-xs text-muted-foreground">{d.rows} rows · {d.cols} cols · {d.createdAt ? new Date(d.createdAt).toLocaleString() : ""}</div>
                  </div>
                  {dataset?.id !== d.id && (
                    <Button variant="ghost" size="sm" onClick={() => activate(d.id!)}>Activate</Button>
                  )}
                  <button onClick={() => remove(d.id!)} className="p-2 rounded-lg hover:bg-destructive/15 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}
