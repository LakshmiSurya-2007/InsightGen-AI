import { useRef, useState } from "react";
import { Download, Maximize2, X } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ScatterChart, Scatter, ResponsiveContainer, XAxis, YAxis, Tooltip,
  CartesianGrid, Legend,
} from "recharts";

export type ChartSpec = {
  type: "bar" | "line" | "area" | "pie" | "scatter" | "histogram";
  title?: string;
  x?: string;
  y?: string | string[];
  data: Record<string, string | number>[];
};

const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const ttip = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 };

export function ChartRenderer({ spec }: { spec: ChartSpec }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(false);

  if (!spec || !Array.isArray(spec.data) || spec.data.length === 0) {
    return <div className="text-xs text-muted-foreground p-4">No data to render.</div>;
  }
  const ys = Array.isArray(spec.y) ? spec.y : spec.y ? [spec.y] : [];

  const downloadPng = async () => {
    const svg = wrapRef.current?.querySelector("svg");
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGElement;
    const computed = getComputedStyle(document.documentElement);
    // Inline a few CSS vars so colours survive serialisation.
    const css = `
      <style>
        text { fill: #d9c8c8; font-family: ui-sans-serif, system-ui; }
        .recharts-cartesian-grid line { stroke: ${computed.getPropertyValue("--border") || "#3a1f24"}; }
      </style>`;
    const svgString = `<?xml version="1.0"?>${css}${new XMLSerializer().serializeToString(clone)}`;
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    const rect = svg.getBoundingClientRect();
    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = rect.width * scale;
      canvas.height = rect.height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#1a0d10";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => {
        if (!b) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(b);
        a.download = `${(spec.title || "chart").replace(/[^a-z0-9]+/gi, "_")}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const card = (
    <div ref={wrapRef} className="glass rounded-xl p-4 shadow-elegant w-full">
      <div className="flex items-center justify-between mb-2 gap-2">
        {spec.title && <h4 className="text-sm font-semibold truncate">{spec.title}</h4>}
        <div className="flex items-center gap-1 ml-auto">
          <button
            type="button" onClick={downloadPng} title="Download PNG"
            className="p-1.5 rounded-md hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            type="button" onClick={() => setFull((v) => !v)} title="Fullscreen"
            className="p-1.5 rounded-md hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
          >
            {full ? <X className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      <div className={full ? "h-[70vh]" : "h-72"}>
        <ResponsiveContainer width="100%" height="100%">{renderInner(spec, ys)}</ResponsiveContainer>
      </div>
    </div>
  );

  if (full) {
    return (
      <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-xl p-4 md:p-10 flex items-center justify-center" onClick={() => setFull(false)}>
        <div className="w-full max-w-6xl" onClick={(e) => e.stopPropagation()}>{card}</div>
      </div>
    );
  }
  return card;
}

function renderInner(spec: ChartSpec, ys: string[]) {
  const x = spec.x ?? Object.keys(spec.data[0])[0];
  switch (spec.type) {
    case "bar":
      return (
        <BarChart data={spec.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey={x} stroke="var(--muted-foreground)" fontSize={12} />
          <YAxis stroke="var(--muted-foreground)" fontSize={12} />
          <Tooltip contentStyle={ttip} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {ys.map((k, i) => <Bar key={k} dataKey={k} fill={PALETTE[i % PALETTE.length]} radius={[6, 6, 0, 0]} />)}
        </BarChart>
      );
    case "line":
      return (
        <LineChart data={spec.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey={x} stroke="var(--muted-foreground)" fontSize={12} />
          <YAxis stroke="var(--muted-foreground)" fontSize={12} />
          <Tooltip contentStyle={ttip} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {ys.map((k, i) => <Line key={k} type="monotone" dataKey={k} stroke={PALETTE[i % PALETTE.length]} strokeWidth={2} dot={{ r: 3 }} />)}
        </LineChart>
      );
    case "area":
      return (
        <AreaChart data={spec.data}>
          <defs>
            {ys.map((k, i) => (
              <linearGradient key={k} id={`grad-${k}-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity={0.55} />
                <stop offset="100%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey={x} stroke="var(--muted-foreground)" fontSize={12} />
          <YAxis stroke="var(--muted-foreground)" fontSize={12} />
          <Tooltip contentStyle={ttip} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {ys.map((k, i) => (
            <Area key={k} type="monotone" dataKey={k} stroke={PALETTE[i % PALETTE.length]} fill={`url(#grad-${k}-${i})`} strokeWidth={2} />
          ))}
        </AreaChart>
      );
    case "pie":
      return (
        <PieChart>
          <Pie data={spec.data} dataKey={ys[0] ?? "value"} nameKey={x} outerRadius={95} innerRadius={50} paddingAngle={3}>
            {spec.data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Pie>
          <Tooltip contentStyle={ttip} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      );
    case "scatter":
      return (
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis type="number" dataKey={x} stroke="var(--muted-foreground)" fontSize={12} name={x} />
          <YAxis type="number" dataKey={ys[0] ?? "y"} stroke="var(--muted-foreground)" fontSize={12} name={ys[0]} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={ttip} />
          <Scatter data={spec.data} fill="var(--chart-2)" />
        </ScatterChart>
      );
    case "histogram":
      return (
        <BarChart data={spec.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey={x} stroke="var(--muted-foreground)" fontSize={12} />
          <YAxis stroke="var(--muted-foreground)" fontSize={12} />
          <Tooltip contentStyle={ttip} />
          <Bar dataKey={ys[0] ?? "count"} fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
        </BarChart>
      );
  }
}

/** Extract chart JSON blocks from assistant markdown content. */
export function extractChartSpecs(text: string): { cleaned: string; specs: ChartSpec[] } {
  const specs: ChartSpec[] = [];
  const re = /```chart\s*([\s\S]*?)```/g;
  const cleaned = text.replace(re, (_m, body) => {
    try {
      const parsed = JSON.parse(body.trim());
      if (parsed && typeof parsed === "object" && parsed.type && Array.isArray(parsed.data)) {
        specs.push(parsed as ChartSpec);
        return "";
      }
    } catch { /* ignore */ }
    return "";
  });
  return { cleaned: cleaned.trim(), specs };
}
