import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/dashboard/Topbar";
import { useState } from "react";
import { DataChat } from "@/components/dashboard/DataChat";
import type { DatasetSummary } from "@/lib/dataset-store";

export const Route = createFileRoute("/dashboard/analytics")({ component: Analytics });

const SUGGESTIONS = [
  "Bar chart of the top categories",
  "Line chart of values over time",
  "Pie chart of category share",
  "Histogram of the main numeric column",
  "Scatter plot between the two main numeric columns",
  "Compare totals across groups",
];

function Analytics() {
  const [dataset, setDataset] = useState<DatasetSummary | null>(null);
  return (
    <>
      <Topbar title="Analytics" subtitle="Ask for any chart — built only from your selected dataset." />
      <DataChat
        dataset={dataset}
        onDatasetChange={setDataset}
        emptyTitle="What should we visualise?"
        emptySubtitle="Type any chart request. The AI will pick the right type and plot real values from your dataset."
        suggestions={SUGGESTIONS}
        chartsOnly
      />
    </>
  );
}
