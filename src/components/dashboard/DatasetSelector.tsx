import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Database, ChevronDown, Upload, Check, FileSpreadsheet, Plus } from "lucide-react";
import {
  listDatasets, loadDataset, setActiveDatasetId, getActiveDatasetId,
  type DatasetSummary,
} from "@/lib/dataset-store";

export function DatasetSelector({
  value,
  onChange,
  compact = false,
}: {
  value: DatasetSummary | null;
  onChange: (d: DatasetSummary | null) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<DatasetSummary[]>([]);

  const refresh = async () => {
    const all = await listDatasets();
    setList(all);
    const activeId = getActiveDatasetId();
    if (!value && all.length > 0) {
      const id = activeId && all.find((d) => d.id === activeId) ? activeId : all[0].id!;
      const full = await loadDataset(id);
      if (full) {
        setActiveDatasetId(full.id!);
        onChange(full);
      }
    }
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  const pick = async (id: string) => {
    setOpen(false);
    const full = await loadDataset(id);
    if (full) {
      setActiveDatasetId(full.id!);
      onChange(full);
    }
  };

  return (
    <div className="relative">
      {compact ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          title={value ? `Dataset: ${value.name} (${value.rows} rows · ${value.cols} cols)` : "Select a dataset"}
          className="grid place-items-center w-9 h-9 rounded-xl glass hover:ring-glow transition shrink-0"
          aria-label="Select dataset"
        >
          <Plus className="w-4 h-4 text-primary" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="glass rounded-xl px-3 py-2 flex items-center gap-2 text-xs hover:ring-glow transition w-full md:w-auto"
        >
          <Database className="w-3.5 h-3.5 text-primary" />
          {value ? (
            <>
              <span className="text-muted-foreground">Dataset:</span>
              <strong className="text-foreground truncate max-w-[200px]">{value.name}</strong>
              <span className="text-muted-foreground">· {value.rows} rows · {value.cols} cols</span>
            </>
          ) : (
            <span className="text-muted-foreground">Select a dataset…</span>
          )}
          <ChevronDown className="w-3.5 h-3.5 opacity-70 ml-auto md:ml-1" />
        </button>
      )}


      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className={`absolute z-40 ${compact ? "bottom-full mb-2 left-0 min-w-[300px]" : "mt-2 left-0 right-0 md:right-auto md:min-w-[320px]"} glass rounded-xl shadow-elegant border border-border overflow-hidden`}>
            <div className="max-h-72 overflow-y-auto">
              {list.length === 0 && (
                <div className="p-4 text-xs text-muted-foreground">
                  No datasets uploaded yet.
                </div>
              )}
              {list.map((d) => {
                const active = value?.id === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => pick(d.id!)}
                    className={`w-full text-left px-3 py-2.5 text-xs flex items-center gap-2 hover:bg-secondary/60 ${active ? "bg-secondary/50" : ""}`}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{d.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {d.rows} rows · {d.cols} cols
                        {d.createdAt ? ` · ${new Date(d.createdAt).toLocaleDateString()}` : ""}
                      </div>
                    </div>
                    {active && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                );
              })}
            </div>
            <Link
              to="/dashboard/upload"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-xs border-t border-border hover:bg-secondary/60 text-primary"
            >
              <Upload className="w-3.5 h-3.5" /> Upload new dataset
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
