import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp } from "lucide-react";

export function StatCard({
  label, value, delta, icon: Icon, accent = "primary",
}: {
  label: string; value: string; delta?: number; icon: LucideIcon; accent?: string;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className="glass rounded-2xl p-5 shadow-elegant hover:ring-glow transition">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 text-2xl font-semibold">{value}</div>
        </div>
        <div className={`grid place-items-center w-10 h-10 rounded-xl bg-${accent}/15 text-${accent}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {typeof delta === "number" && (
        <div className={`mt-3 inline-flex items-center gap-1 text-xs ${up ? "text-chart-3" : "text-destructive"}`}>
          {up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          {Math.abs(delta).toFixed(1)}%
        </div>
      )}
    </div>
  );
}
