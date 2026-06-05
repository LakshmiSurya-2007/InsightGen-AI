import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles, BarChart3, Upload, Brain, ShieldCheck, Zap,
  ArrowRight, MessageSquare, LineChart as LineIcon, BrainCircuit
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "InsightGen AI — Chat with your data, get instant charts" },
      { name: "description", content: "Upload a CSV or Excel file, ask any analytics question in plain English, and InsightGen AI generates the insights and charts for you. Free forever." },
      { property: "og:title", content: "InsightGen AI — AI Data Analytics Assistant" },
      { property: "og:description", content: "Chat with your data. Get dynamic charts. Powered by Gen AI." },
    ],
  }),
});

function Landing() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/60 border-b border-border">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <div className="grid place-items-center w-8 h-8 rounded-lg gradient-primary shadow-glow">
              <BrainCircuit className="w-4 h-4 text-primary-foreground" />
            </div>
            InsightGen AI
          </Link>
          <nav className="ml-10 hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition">Features</a>
            <a href="#how" className="hover:text-foreground transition">How it works</a>
            <a href="#faq" className="hover:text-foreground transition">FAQ</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link to="/signup">
              <Button size="sm" className="gradient-primary text-primary-foreground border-0 shadow-glow">
                Get started free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-6 pt-20 pb-24">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground mb-6">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Free · Powered by Gen AI
          </div>
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
            Chat with your data.{" "}
            <span className="gradient-text">Get instant charts.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Upload your CSV or Excel, ask anything in plain English — InsightGen AI
            analyses your numbers and renders the visualisation that answers the question.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link to="/signup">
              <Button size="lg" className="gradient-primary text-primary-foreground border-0 shadow-glow">
                Start free <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="glass">Sign in</Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">No credit card. 100% free.</p>
        </div>

        {/* Showcase card */}
        <div className="mt-20 glass-strong rounded-3xl p-3 shadow-elegant animate-float">
          <div className="rounded-2xl bg-card/80 p-8 grid md:grid-cols-2 gap-6 items-center">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">You ask</div>
              <div className="glass rounded-xl p-4 text-sm">"Plot monthly revenue and show me the top 3 product categories."</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 mt-6">InsightGen AI replies</div>
              <div className="glass rounded-xl p-4 text-sm">
                Revenue peaked in Q4. Top categories: <strong>Electronics</strong>,
                <strong> Apparel</strong>, <strong>Home</strong>. Chart on the right →
              </div>
            </div>
            <div className="glass rounded-xl p-5">
              <div className="flex items-end gap-2 h-44">
                {[42, 58, 49, 71, 65, 88, 95, 79, 102, 118, 134, 156].map((v, i) => (
                  <div key={i} className="flex-1 rounded-t-md gradient-ember"
                    style={{ height: `${(v / 160) * 100}%` }} />
                ))}
              </div>
              <div className="mt-3 text-xs text-muted-foreground flex justify-between">
                <span>Jan</span><span>Jun</span><span>Dec</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Everything you need to talk to your data</h2>
          <p className="mt-3 text-muted-foreground">Conversational analytics meets a beautiful dashboard.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Upload, title: "Drag, drop, done", body: "CSV and Excel uploads with instant schema detection and quality checks." },
            { icon: MessageSquare, title: "Ask in plain English", body: "‘Show sales by region’, ‘plot the trend’ — InsightGen turns it into the right chart." },
            { icon: LineIcon, title: "Dynamic visualisations", body: "Bar, line, area, pie, scatter, histogram — auto-generated from your dataset." },
            { icon: Brain, title: "Real insights", body: "Anomaly detection, trends, recommendations and forecasts — grounded in your numbers." },
            { icon: ShieldCheck, title: "Yours and yours only", body: "Row-level security: each user only ever sees their own uploads and chats." },
            { icon: Zap, title: "Free forever", body: "No paywalls, no plans. Upload, analyse, ship decisions." },
          ].map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6 hover:ring-glow transition-all">
              <div className="grid place-items-center w-10 h-10 rounded-xl bg-primary/15 text-primary mb-4">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">From spreadsheet to insight in 3 steps</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { n: "01", t: "Create your free account", d: "Sign up with email or Google. No credit card, no plans." },
            { n: "02", t: "Upload your dataset", d: "Drop in a CSV or Excel. InsightGen profiles it in seconds." },
            { n: "03", t: "Ask anything", d: "‘Plot revenue by month’, ‘compare regions’, ‘predict next quarter’." },
          ].map((s) => (
            <div key={s.n} className="glass rounded-2xl p-6">
              <div className="text-xs font-semibold gradient-text">{s.n}</div>
              <h3 className="mt-2 font-semibold">{s.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-6 py-24">
        <h2 className="text-3xl font-semibold tracking-tight text-center mb-10">Frequently asked</h2>
        <div className="space-y-3">
          {[
            { q: "Is InsightGen AI really free?", a: "Yes. No plans, no paywalls. Upload as many datasets as you want." },
            { q: "Which AI model is used?", a: "A powerful Gen AI model accessed through a secure server gateway — your data is sent only to generate the response you asked for." },
            { q: "What file formats are supported?", a: "CSV and Excel (.xlsx, .xls). Drag and drop or browse to upload." },
            { q: "Who can see my data?", a: "Only you. Datasets and chat history are stored with row-level security and scoped to your account." },
          ].map((f) => (
            <details key={f.q} className="group glass rounded-xl p-5">
              <summary className="cursor-pointer list-none font-medium flex items-center justify-between">
                {f.q}
                <ArrowRight className="w-4 h-4 text-muted-foreground group-open:rotate-90 transition" />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="glass-strong rounded-3xl p-10 md:p-14 text-center shadow-elegant">
          <BarChart3 className="w-8 h-8 text-primary mx-auto mb-4" />
          <h3 className="text-3xl font-semibold tracking-tight">Ready to talk to your data?</h3>
          <p className="mt-3 text-muted-foreground">Free forever. Sign up and upload your first dataset in under a minute.</p>
          <Link to="/signup" className="inline-block mt-6">
            <Button size="lg" className="gradient-primary text-primary-foreground border-0 shadow-glow">
              Create your free account
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} InsightGen AI. All rights reserved.</div>
          <div className="flex gap-5">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
