import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Upload, BarChart3, Sparkles, History, Settings,
  BrainCircuit, LogOut, Menu, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dashboard/upload", label: "Datasets", icon: Upload },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/assistant", label: "AI Assistant", icon: Sparkles },
  { to: "/dashboard/history", label: "History", icon: History },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 grid place-items-center w-10 h-10 rounded-xl glass-strong"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>
      {open && (
        <div className="md:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}
      <aside className={cn(
        "fixed md:sticky top-0 left-0 z-50 md:z-0 h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/95 backdrop-blur-xl flex transition-transform md:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid place-items-center w-9 h-9 rounded-xl gradient-primary shadow-glow">
              <BrainCircuit className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-semibold text-sidebar-foreground leading-tight">InsightGen AI</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Analytics suite</div>
            </div>
          </Link>
          <button onClick={() => setOpen(false)} className="md:hidden p-1.5 rounded-lg hover:bg-sidebar-accent">
            <X className="w-4 h-4" />
          </button>
        </div>
        <Nav onNavigate={() => setOpen(false)} />
        <SidebarFooter />
      </aside>
    </>
  );
}

function Nav({ onNavigate }: { onNavigate: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {items.map(({ to, label, icon: Icon }) => {
        const active = pathname === to || (to !== "/dashboard" && pathname.startsWith(to));
        return (
          <Link
            key={to} to={to} onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-elegant"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
            {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter() {
  const navigate = useNavigate();
  const logout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/login" });
  };
  return (
    <div className="p-3 space-y-2 border-t border-sidebar-border">
      <div className="p-4 rounded-xl glass">
        <div className="flex items-center gap-2 text-xs font-medium text-primary mb-1">
          <Sparkles className="w-3.5 h-3.5" /> Powered by Gen AI
        </div>
        <p className="text-xs text-muted-foreground">Ask for any chart in plain English.</p>
      </div>
      <button onClick={logout}
        className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition">
        <LogOut className="w-4 h-4" /> Sign out
      </button>
    </div>
  );
}
