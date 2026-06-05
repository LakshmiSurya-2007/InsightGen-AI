import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Topbar } from "@/components/dashboard/Topbar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/dashboard/settings")({ component: Settings });

function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const logout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/login" });
  };
  return (
    <>
      <Topbar title="Settings" subtitle="Manage your account." />
      <div className="p-6 grid gap-6 max-w-2xl">
        <div className="glass rounded-2xl p-6 shadow-elegant">
          <h3 className="text-sm font-semibold">Account</h3>
          <p className="text-xs text-muted-foreground mt-1">Your InsightGen AI workspace.</p>
          <div className="mt-4 grid gap-3 text-sm">
            <Row label="Name" value={(user?.user_metadata?.full_name as string) || "—"} />
            <Row label="Email" value={user?.email ?? "—"} />
            <Row label="User ID" value={user?.id ?? "—"} mono />
          </div>
        </div>
        <div className="glass rounded-2xl p-6 shadow-elegant">
          <h3 className="text-sm font-semibold">Session</h3>
          <p className="text-xs text-muted-foreground mt-1">Sign out of this device.</p>
          <Button variant="outline" className="mt-4" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" /> Sign out
          </Button>
        </div>
      </div>
    </>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={`truncate ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
