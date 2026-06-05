import { useEffect, useState } from "react";
import { MessageSquarePlus, Trash2, Pencil, MessageSquare, Check, X } from "lucide-react";
import {
  listConversations,
  deleteConversation,
  renameConversation,
  type Conversation,
} from "@/lib/conversations";
import { cn } from "@/lib/utils";

export function ConversationsPanel({
  activeId,
  onSelect,
  onNew,
  refreshKey,
}: {
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  refreshKey: number;
}) {
  const [items, setItems] = useState<Conversation[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const refresh = () => listConversations().then(setItems).catch(() => setItems([]));
  useEffect(() => { refresh(); }, [refreshKey]);

  const saveRename = async (id: string) => {
    if (draft.trim()) await renameConversation(id, draft.trim());
    setEditing(null);
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this conversation?")) return;
    await deleteConversation(id);
    if (id === activeId) onNew();
    refresh();
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border bg-background/40">
      <div className="p-3 border-b border-border">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl gradient-primary text-primary-foreground text-sm shadow-glow hover:opacity-90 transition"
        >
          <MessageSquarePlus className="w-4 h-4" /> New chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {items.length === 0 && (
          <p className="text-[11px] text-muted-foreground px-3 py-4 text-center">
            No conversations yet.
          </p>
        )}
        {items.map((c) => {
          const active = c.id === activeId;
          const isEditing = editing === c.id;
          return (
            <div
              key={c.id}
              className={cn(
                "group rounded-lg px-2.5 py-2 text-sm flex items-center gap-2 cursor-pointer transition",
                active ? "bg-secondary/80 text-foreground" : "hover:bg-secondary/40 text-muted-foreground",
              )}
              onClick={() => !isEditing && onSelect(c.id)}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              {isEditing ? (
                <>
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveRename(c.id);
                      if (e.key === "Escape") setEditing(null);
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 bg-transparent outline-none text-sm border-b border-primary"
                  />
                  <button onClick={(e) => { e.stopPropagation(); saveRename(c.id); }} className="p-0.5">
                    <Check className="w-3.5 h-3.5 text-primary" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setEditing(null); }} className="p-0.5">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 truncate text-[13px]">{c.title}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditing(c.id); setDraft(c.title); }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-primary"
                    title="Rename"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); remove(c.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
