import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/dashboard/Topbar";
import { useState } from "react";
import { DataChat } from "@/components/dashboard/DataChat";
import type { DatasetSummary } from "@/lib/dataset-store";

export const Route = createFileRoute("/dashboard/assistant")({ component: Assistant });

const SUGGESTIONS = [
  "Summarise the dataset in 3 bullets",
  "What are the top trends and outliers?",
  "Bar chart of the top 10 values",
  "Detect missing values and data quality issues",
];

function Assistant() {
  const [dataset, setDataset] = useState<DatasetSummary | null>(null);
  return (
    <>
      <Topbar title="AI Assistant" subtitle="Ask anything about your selected dataset." />
      <DataChat
        dataset={dataset}
        onDatasetChange={setDataset}
        emptyTitle="What should we explore?"
        emptySubtitle="Ask for insights, summaries, predictions, or any chart you need."
        suggestions={SUGGESTIONS}
      />
    </>
  );
}
