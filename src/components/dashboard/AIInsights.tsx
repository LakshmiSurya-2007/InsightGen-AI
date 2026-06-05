import { Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function AIInsights() {
  return (
    <div className="glass rounded-2xl p-5 shadow-elegant">
      <div className="flex items-center gap-2 text-xs font-medium text-primary mb-3">
        <Sparkles className="w-3.5 h-3.5" /> AI insights
      </div>
      <p className="text-sm text-muted-foreground">
        Ask InsightGen anything about your dataset and it will explain trends, anomalies and recommendations.
      </p>
      <Link to="/dashboard/assistant" className="mt-4 inline-block text-sm text-primary hover:underline">
        Open AI Assistant →
      </Link>
    </div>
  );
}
