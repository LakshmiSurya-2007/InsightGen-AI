// Persistent chat history backed by the database (conversations + messages).
import { supabase } from "@/integrations/supabase/client";

export type ChatRole = "user" | "assistant";

export interface Conversation {
  id: string;
  title: string;
  dataset_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoredMessage {
  id: string;
  role: ChatRole;
  content: string;
  created_at: string;
}

const db = supabase as any;

export async function listConversations(): Promise<Conversation[]> {
  const { data, error } = await db
    .from("conversations")
    .select("id,title,dataset_id,created_at,updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Conversation[];
}

export async function createConversation(
  title: string,
  datasetId: string | null,
): Promise<Conversation> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not authenticated");
  const { data, error } = await db
    .from("conversations")
    .insert({ user_id: u.user.id, title: title.slice(0, 80), dataset_id: datasetId })
    .select()
    .single();
  if (error) throw error;
  return data as Conversation;
}

export async function renameConversation(id: string, title: string) {
  const { error } = await db
    .from("conversations")
    .update({ title: title.slice(0, 120), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function touchConversation(id: string) {
  await db
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", id);
}

export async function deleteConversation(id: string) {
  const { error } = await db.from("conversations").delete().eq("id", id);
  if (error) throw error;
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const { data, error } = await db
    .from("conversations")
    .select("id,title,dataset_id,created_at,updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Conversation | null;
}

export async function loadMessages(conversationId: string): Promise<StoredMessage[]> {
  const { data, error } = await db
    .from("messages")
    .select("id,role,content,created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as StoredMessage[];
}

export async function saveMessage(
  conversationId: string,
  role: ChatRole,
  content: string,
  datasetId: string | null,
) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not authenticated");
  const { data, error } = await db.from("messages").insert({
    user_id: u.user.id,
    conversation_id: conversationId,
    dataset_id: datasetId,
    role,
    content,
  }).select("id,role,content,created_at").single();
  if (error) throw error;
  return data as StoredMessage;
}
