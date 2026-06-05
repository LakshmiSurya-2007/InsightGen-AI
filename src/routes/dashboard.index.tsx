import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Topbar } from "@/components/dashboard/Topbar";
import { StatCard } from "@/components/dashboard/StatCard";
import { loadDataset, listDatasets, type DatasetSummary } from "@/lib/dataset-store";
import { groupCount, groupSum } from "@/lib/analytics-helpers";
import { useAuth } from "@/hooks/use-auth";
import {
  BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Database, Rows3, Columns3, AlertTriangle, ArrowRight, Upload, Sparkles, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/")({ component: DashboardHome });

const ttip = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 };
const PAL = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function DashboardHome() {
  const { user } = useAuth();
  const [dataset, setDataset] = useState<DatasetSummary | null>(null);
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const name = (user?.user_metadata?.full_name as string) || user?.email?.split("@")[0] || "there";

  useEffect(() => {
    loadDataset().then(setDataset);
    listDatasets().then(setDatasets);
  }, []);

  const breakdown = useMemo(() => {
    if (!dataset) return [];
    const cat = dataset.categoricalCols[0];
    const num = dataset.numericCols[0];
    if (cat && num) return groupSum(dataset.data, cat, num, 8);
    if (cat) return groupCount(dataset.data, cat, 8);
    return [];
  }, [dataset]);

  const breakdownLabel = useMemo(() => {
    if (!dataset) return "";
    const cat = dataset.categoricalCols[0];
    const num = dataset.numericCols[0];
    if (cat && num) return `${num} by ${cat}`;
    if (cat) return `Count by ${cat}`;
    return "";
  }, [dataset]);

  const share = useMemo(() => {
    if (!dataset) return [];
    const cat = dataset.categoricalCols[0];
    return cat ? groupCount(dataset.data, cat, 5) : [];
  }, [dataset]);

  return (
    <>
      <Topbar title={`Welcome back, ${name}`} subtitle="Your AI-powered analytics workspace." />
      <div className="p-4 md:p-6 space-y-6">
        {!dataset ? (
          <EmptyState />
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Rows" value={dataset.rows.toLocaleString()} icon={Rows3} accent="primary" />
              <StatCard label="Columns" value={String(dataset.cols)} icon={Columns3} accent="accent" />
              <StatCard label="Numeric cols" value={String(dataset.numericCols.length)} icon={Database} accent="chart-3" />
              <StatCard label="Missing values" value={dataset.missing.toLocaleString()} icon={AlertTriangle} accent="chart-4" />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 glass rounded-2xl p-5 shadow-elegant">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold">{breakdownLabel || "Top values"}</h3>
                    <p className="text-xs text-muted-foreground">Auto-generated from <strong>{dataset.name}</strong></p>
                  </div>
                  <Link to="/dashboard/analytics" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
                    Open analytics <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={breakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                      <Tooltip contentStyle={ttip} />
                      <Bar dataKey="value" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass rounded-2xl p-5 shadow-elegant flex flex-col">
                <div className="flex items-center gap-2 text-xs font-medium text-primary mb-3">
                  <Sparkles className="w-3.5 h-3.5" /> Quick actions
                </div>
                <div className="space-y-2 flex-1">
                  <Link to="/dashboard/assistant">
                    <Button variant="outline" className="w-full justify-start glass">
                      <Sparkles className="w-4 h-4 mr-2" /> Ask AI about this data
                    </Button>
                  </Link>
                  <Link to="/dashboard/analytics">
                    <Button variant="outline" className="w-full justify-start glass">
                      <Database className="w-4 h-4 mr-2" /> View full analytics
                    </Button>
                  </Link>
                  <Link to="/dashboard/upload">
                    <Button variant="outline" className="w-full justify-start glass">
                      <Upload className="w-4 h-4 mr-2" /> Upload another dataset
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {share.length > 0 && (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="glass rounded-2xl p-5 shadow-elegant">
                  <h3 className="text-sm font-semibold mb-1">Top categories</h3>
                  <p className="text-xs text-muted-foreground mb-3">Distribution</p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={share} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
                          {share.map((_, i) => <Cell key={i} fill={PAL[i % PAL.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={ttip} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="lg:col-span-2 glass rounded-2xl p-5 shadow-elegant">
                  <h3 className="text-sm font-semibold mb-3">Your datasets</h3>
                  <ul className="divide-y divide-border max-h-64 overflow-y-auto">
                    {datasets.map((d) => (
                      <li key={d.id} className="flex items-center gap-3 py-3 text-sm">
                        <FileSpreadsheet className="w-4 h-4 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{d.name}</div>
                          <div className="text-xs text-muted-foreground">{d.rows} rows · {d.cols} cols</div>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : ""}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <div className="glass rounded-3xl p-12 text-center shadow-elegant">
      <div className="grid place-items-center w-16 h-16 mx-auto rounded-2xl gradient-primary shadow-glow mb-4">
        <Upload className="w-7 h-7 text-primary-foreground" />
      </div>
      <h2 className="text-xl font-semibold">Upload your first dataset</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
        InsightGen AI works on the data <em>you</em> upload — CSV or Excel. Drop in a file
        and your dashboard will populate instantly.
      </p>
      <Link to="/dashboard/upload">
        <Button className="mt-6 gradient-primary text-primary-foreground border-0 shadow-glow">
          Upload dataset
        </Button>
      </Link>
    </div>
  );
}
