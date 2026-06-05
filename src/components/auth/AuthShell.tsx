import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 border-r border-border relative overflow-hidden">
        <div className="absolute inset-0 opacity-40 pointer-events-none"
             style={{ background: "radial-gradient(circle at 30% 20%, var(--primary), transparent 60%)" }} />
        <Link to="/" className="flex items-center gap-2 font-semibold relative z-10">
          <div className="grid place-items-center w-9 h-9 rounded-xl gradient-primary shadow-glow">
            <BrainCircuit className="w-5 h-5 text-primary-foreground" />
          </div>
          InsightGen AI
        </Link>
        <div className="relative z-10">
          <h2 className="text-3xl font-semibold tracking-tight leading-tight">
            Decisions, made <span className="gradient-text">measurable</span>.
          </h2>
          <p className="mt-3 text-muted-foreground max-w-md">
            Upload your dataset, chat with it in natural language, and let InsightGen
            generate the charts and insights — all in one polished workspace.
          </p>
          <div className="mt-8 glass rounded-2xl p-5 max-w-md">
            <p className="text-sm">"Plot monthly revenue and tell me which region grew the fastest."</p>
            <p className="mt-1 text-xs text-muted-foreground">— You, in plain English</p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground relative z-10">© {new Date().getFullYear()} InsightGen AI</div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.history.back()}
            className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6 glass rounded-2xl p-6 shadow-elegant">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function GoogleButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <Button type="button" variant="outline" className="w-full glass" onClick={onClick} disabled={disabled}>
      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
        <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4-5.5 4-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.5 14.6 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12s4.3 9.5 9.5 9.5c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.5H12z" />
      </svg>
      Continue with Google
    </Button>
  );
}

export function Divider() {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <div className="flex-1 h-px bg-border" /> OR <div className="flex-1 h-px bg-border" />
    </div>
  );
}
