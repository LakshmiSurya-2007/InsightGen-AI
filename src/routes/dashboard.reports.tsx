import { createFileRoute, Link } from "@tanstack/react-router";
import { Topbar } from "@/components/dashboard/Topbar";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/dashboard/reports")({ component: Reports });

function Reports() {
  return (
    <>
      <Topbar title="Reports" subtitle="Generated insights." />
      <div className="p-6">
        <div className="glass rounded-2xl p-10 text-center">
          <Sparkles className="w-8 h-8 text-primary mx-auto" />
          <h3 className="mt-3 text-lg font-semibold">Generate a report</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Head to the AI Assistant and ask "generate a full report" — InsightGen will
            summarise your dataset with insights, recommendations and charts.
          </p>
          <Link to="/dashboard/assistant" className="text-primary text-sm hover:underline mt-4 inline-block">
            Open AI Assistant →
          </Link>
        </div>
      </div>
    </>
  );
}
