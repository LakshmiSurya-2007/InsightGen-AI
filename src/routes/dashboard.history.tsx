import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Topbar } from "@/components/dashboard/Topbar";
import { listDatasets, type DatasetSummary } from "@/lib/dataset-store";
import { FileSpreadsheet } from "lucide-react";

export const Route = createFileRoute("/dashboard/history")({ component: History });

function History() {
  const [list, setList] = useState<DatasetSummary[]>([]);
  useEffect(() => { listDatasets().then(setList); }, []);
  return (
    <>
      <Topbar title="History" subtitle="Everything you've uploaded." />
      <div className="p-6">
        {list.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">
            No history yet. <Link to="/dashboard/upload" className="text-primary hover:underline">Upload your first dataset →</Link>
          </div>
        ) : (
          <div className="glass rounded-2xl p-5">
            <ul className="divide-y divide-border">
              {list.map((d) => (
                <li key={d.id} className="flex items-center gap-3 py-3 text-sm">
                  <FileSpreadsheet className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{d.name}</div>
                    <div className="text-xs text-muted-foreground">{d.rows} rows · {d.cols} cols</div>
                  </div>
                  <span className="text-xs text-muted-foreground">{d.createdAt ? new Date(d.createdAt).toLocaleString() : ""}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
