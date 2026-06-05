import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user } = useAuth();
  const email = user?.email ?? "";
  const name = (user?.user_metadata?.full_name as string) || email.split("@")[0] || "You";
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-border bg-background/70 px-6 py-4 backdrop-blur-xl">
      <div className="min-w-0 pl-12 md:pl-0">
        <h1 className="text-lg font-semibold truncate">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
      </div>
      <div className="ml-auto flex items-center gap-3">
        <button className="relative grid place-items-center w-9 h-9 rounded-lg glass hover:bg-secondary/80 transition">
          <Bell className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <div className="w-8 h-8 rounded-full gradient-primary grid place-items-center text-xs font-semibold text-primary-foreground">
            {initials}
          </div>
          <div className="hidden sm:block text-xs leading-tight">
            <div className="font-medium truncate max-w-[140px]">{name}</div>
            <div className="text-muted-foreground truncate max-w-[140px]">{email}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
