import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Sparkles, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChartRenderer, extractChartSpecs, type ChartSpec } from "@/lib/chart-renderer";
import { DatasetSelector } from "@/components/dashboard/DatasetSelector";
import { MarkdownMessage } from "@/components/dashboard/MarkdownMessage";
import { ConversationsPanel } from "@/components/dashboard/ConversationsPanel";
import type { DatasetSummary } from "@/lib/dataset-store";
import { loadDataset, setActiveDatasetId } from "@/lib/dataset-store";
import { tryLocalAnswer } from "@/lib/local-query";
import { streamGemini, hasGeminiKey } from "@/lib/gemini";
import {
  createConversation, getConversation, listConversations, loadMessages, saveMessage, renameConversation, touchConversation,
} from "@/lib/conversations";
import { useAuth } from "@/hooks/use-auth";

export interface DataChatProps {
  dataset: DatasetSummary | null;
  onDatasetChange: (d: DatasetSummary | null) => void;
  emptyTitle: string;
  emptySubtitle: string;
  suggestions: string[];
  chartsOnly?: boolean;
}

type Msg = { id: string; role: "user" | "assistant"; text: string };

const SYSTEM = `You are InsightGen AI, an expert data analyst.
You analyse the user's uploaded dataset and respond with grounded, factual answers.

FORMATTING:
- Always use rich Markdown: headings (##, ###), **bold**, bullet lists,
  numbered lists, tables, > blockquotes, and \`inline code\` where helpful.
- Structure long answers with clear sections. Keep paragraphs short.

ABSOLUTE RULES:
1. The dataset context contains the EXACT row count, column list, statistics
   and sample rows. ALL numeric claims must be computed from those values.
   NEVER invent numbers.
2. If a column is NOT in the dataset context, reply ONLY with:
   "<column> is not in the selected dataset. Available columns: <list>."
3. If no dataset context is provided, reply: "Please select a dataset first."

CHART RESPONSES:
When the user asks for a chart/plot/graph/trend/distribution/comparison,
emit ONE fenced code block of language "chart" with valid JSON:

\`\`\`chart
{
  "type": "bar" | "line" | "area" | "pie" | "scatter" | "histogram",
  "title": "<short title>",
  "x": "<column>",
  "y": "<column>" | ["<col1>", "<col2>"],
  "data": [ { "<x>": "...", "<y>": 123 } ]
}
\`\`\`

CHART RULES:
- Derive "data" from the sample rows. Aggregate as needed but every number
  must trace back to real rows.
- "x" and "y" MUST be columns from the context.
- Keep "data" small (<= 40 points). Round to 2 decimals.
- The JSON block must contain ONLY the JSON.

Add a short 1-3 sentence insight before any chart. Be concise.`;

function buildContext(d: DatasetSummary, chartsOnly: boolean): string {
  const sampleSize = Math.min(d.data.length, 150);
  const sample = d.data.slice(0, sampleSize);
  const lines = [
    `Dataset name: ${d.name}`,
    `Exact row count: ${d.rows}`,
    `Exact column count: ${d.cols}`,
    `All columns: ${JSON.stringify(d.columns)}`,
    `Numeric columns: ${JSON.stringify(d.numericCols)}`,
    `Categorical columns: ${JSON.stringify(d.categoricalCols)}`,
    `Total missing values: ${d.missing}`,
    `Per-column numeric stats (min/max/avg): ${JSON.stringify(d.stats)}`,
    `Sample rows (first ${sampleSize} of ${d.rows}): ${JSON.stringify(sample)}`,
  ];
  if (chartsOnly) {
    lines.push("MODE: chart-first. Always include a chart block when possible.");
  }
  return lines.join("\n");
}

export function DataChat({
  dataset, onDatasetChange, emptyTitle, emptySubtitle, suggestions, chartsOnly,
}: DataChatProps) {
  const { user } = useAuth();
  const datasetContext = useMemo(
    () => (dataset ? buildContext(dataset, !!chartsOnly) : undefined),
    [dataset, chartsOnly]
  );

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [convRefresh, setConvRefresh] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const bootstrap = async () => {
      try {
        const conversations = await listConversations();
        if (cancelled || conversations.length === 0) return;

        const first = conversations[0];
        setConversationId(first.id);

        if (first.dataset_id) {
          const fullDataset = await loadDataset(first.dataset_id);
          if (!cancelled && fullDataset) {
            setActiveDatasetId(fullDataset.id ?? null);
            onDatasetChange(fullDataset);
          }
        }

        const rows = await loadMessages(first.id);
        if (!cancelled) {
          setMessages(rows.map((r) => ({ id: r.id, role: r.role, text: r.content })));
        }
      } catch (error) {
        console.error("[chat] failed to bootstrap conversations", error);
      }
    };

    if (!conversationId && messages.length === 0 && convRefresh === 0) {
  bootstrap();
}

    return () => {
      cancelled = true;
    };
  }, [conversationId, messages.length, convRefresh, onDatasetChange, user]);

const startNew = async () => {
  setMessages([]);

  if (!dataset) {
    setConversationId(null);
    return;
  }

  try {
    const conv = await createConversation(
      "New Chat",
      dataset.id ?? null
    );

    setConversationId(conv.id);
    setConvRefresh((n) => n + 1);
  } catch (error) {
    console.error("[chat] failed to create conversation", error);
  }
};

  const openConversation = async (id: string) => {
    const conversation = await getConversation(id);
    setConversationId(id);
    if (conversation?.dataset_id) {
      const fullDataset = await loadDataset(conversation.dataset_id);
      if (fullDataset) {
        setActiveDatasetId(fullDataset.id ?? null);
        onDatasetChange(fullDataset);
      }
    }
    const rows = await loadMessages(id);
    setMessages(rows.map((r) => ({ id: r.id, role: r.role, text: r.content })));
  };

  const disabled = !dataset || busy;

  const submit = async (text: string) => {
    const t = text.trim();
    if (!t || !dataset || busy) return;
    setInput("");

    console.log("[InsightGen] submit:", { dataset: dataset.name, rows: dataset.rows, query: t });

    // Push user message immediately.
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", text: t };
    setMessages((p) => [...p, userMsg]);

    // Ensure we have a conversation row.
    let convId = conversationId;

if (!convId) {
  try {
    const conv = await createConversation(
      t.slice(0, 60),
      dataset.id ?? null
    );

    convId = conv.id;
    setConversationId(conv.id);
    setConvRefresh((n) => n + 1);
  } catch (err) {
    console.error("[chat] could not create conversation", err);
    return;
  }
}
    if (convId) {
      try {
        await saveMessage(convId, "user", t, dataset.id ?? null);
      } catch (error) {
        console.error("[chat] failed to save user message", error);
      }
    }

    const finishAssistant = async (body: string) => {
      if (convId) {
        try {
          await saveMessage(convId, "assistant", body, dataset.id ?? null);
          await touchConversation(convId);
          setConvRefresh((n) => n + 1);
        } catch (error) {
          console.error("[chat] failed to save assistant message", error);
        }
      }
    };

    // Deterministic local answer first.
    const local = tryLocalAnswer(t, dataset);
    if (local) {
      const body = [
        local.text,
        ...local.charts.map((c: ChartSpec) => "```chart\n" + JSON.stringify(c) + "\n```"),
      ].join("\n\n");
      setMessages((p) => [...p, { id: crypto.randomUUID(), role: "assistant", text: body }]);
      await finishAssistant(body);
      return;
    }

    if (!hasGeminiKey()) {
      const body = "⚠️ Gemini API key is missing. Add `GEMINI_API_KEY` to your server environment.";
      setMessages((p) => [...p, { id: crypto.randomUUID(), role: "assistant", text: body }]);
      await finishAssistant(body);
      return;
    }

    setBusy(true);
    const aiId = crypto.randomUUID();
    setMessages((p) => [...p, { id: aiId, role: "assistant", text: "" }]);

    let acc = "";
    try {
      const system = `${SYSTEM}\n\nDataset context (use ONLY these values):\n${datasetContext}`;
      for await (const chunk of streamGemini({ system, prompt: t })) {
        acc += chunk;
        setMessages((p) => p.map((m) => (m.id === aiId ? { ...m, text: acc } : m)));
      }
      await finishAssistant(acc);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      const body = `❌ ${msg}`;
      setMessages((p) => p.map((m) => (m.id === aiId ? { ...m, text: body } : m)));
      await finishAssistant(body);
    } finally {
      setBusy(false);
      // Auto-title conversation from first user message if still default.
      if (convId && messages.length === 0) {
        renameConversation(convId, t.slice(0, 60)).catch(() => {});
      }
    }
  };

  return (
    <div className="flex h-[calc(100vh-69px)]">
      <ConversationsPanel
        activeId={conversationId}
        onSelect={openConversation}
        onNew={startNew}
        refreshKey={convRefresh}
      />

      <div className="flex flex-col flex-1 min-w-0">
        {!dataset && (
          <div className="px-4 md:px-6 pt-4">
            <div className="glass rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-destructive w-fit">
              <AlertCircle className="w-3.5 h-3.5" />
              Tap the <Plus className="w-3 h-3 inline" /> in the prompt to select a dataset.
            </div>
          </div>
        )}

        <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="max-w-2xl mx-auto text-center py-12">
              <div className="grid place-items-center w-14 h-14 mx-auto rounded-2xl gradient-primary shadow-glow mb-4">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-semibold">{emptyTitle}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{emptySubtitle}</p>
              <div className="mt-6 grid sm:grid-cols-2 gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    disabled={disabled}
                    className="glass rounded-xl p-3 text-sm text-left hover:ring-glow transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => {
            const mine = m.role === "user";
            const { cleaned, specs } = mine
              ? { cleaned: m.text, specs: [] as ChartSpec[] }
              : extractChartSpecs(m.text);
            return (
              <div key={m.id} className={`flex gap-3 ${mine ? "justify-end" : ""}`}>
                {!mine && (
                  <div className="w-8 h-8 rounded-full gradient-primary shrink-0 grid place-items-center text-[10px] font-semibold text-primary-foreground">
                    AI
                  </div>
                )}
                <div className={`max-w-[85%] space-y-3 ${mine ? "items-end" : ""}`}>
                  {(cleaned || (busy && !mine)) && (
                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      mine
                        ? "bg-primary text-primary-foreground rounded-br-sm whitespace-pre-wrap"
                        : "glass rounded-bl-sm text-foreground border border-border/60"
                    }`}>
                      {mine ? cleaned : (cleaned ? <MarkdownMessage>{cleaned}</MarkdownMessage> : "…")}
                    </div>
                  )}
                  {specs.map((s, i) => <ChartRenderer key={i} spec={s} />)}
                </div>
              </div>
            );
          })}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); submit(input); }}
          className="border-t border-border bg-background/60 backdrop-blur-xl p-4"
        >
          <div className="mx-auto max-w-3xl flex items-end gap-2 glass rounded-2xl p-2">
            <DatasetSelector value={dataset} onChange={onDatasetChange} compact />
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(input); }
              }}
              placeholder={
                dataset
                  ? (chartsOnly ? `Ask any chart on "${dataset.name}" — e.g. bar chart of sales by region` : `Ask anything about "${dataset.name}"…`)
                  : "Tap + to select a dataset, then ask…"
              }
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none px-3 py-2 text-sm min-h-[40px] max-h-40"
            />

            <Button type="submit" disabled={disabled || !input.trim()}
              className="gradient-primary text-primary-foreground border-0 shadow-glow">
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-center text-[10px] text-muted-foreground mt-2">
            Powered by Gen AI · Answers are grounded in the selected dataset.
          </p>
        </form>
      </div>
    </div>
  );
}
