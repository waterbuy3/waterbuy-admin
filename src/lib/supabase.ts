import { createClient, type User } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const isSupabaseConfigured =
  !!supabaseUrl &&
  supabaseUrl !== "REPLACE_ME" &&
  supabaseUrl !== "undefined";

export const isConfigured = isSupabaseConfigured;

// Standalone PWA gets its own storage key → separate BroadcastChannel from
// the browser tab, so signing out in Chrome doesn't evict the PWA session.
const isPwa = typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
   (navigator as { standalone?: boolean }).standalone === true);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: "implicit",
        persistSession: true,
        detectSessionInUrl: true,
        autoRefreshToken: true,
        storageKey: isPwa ? "aqp-admin-pwa" : "aqp-admin-browser",
      },
    })
  : null;

export type { User };

export async function adminSignIn(email: string, password: string): Promise<string | null> {
  if (!supabase) return "Supabase not configured";
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? error.message : null;
}

export async function adminSignUp(email: string, password: string): Promise<string | null> {
  if (!supabase) return "Supabase not configured";
  const { error } = await supabase.auth.signUp({ email, password });
  return error ? error.message : null;
}

export async function adminSignOut(): Promise<void> {
  await supabase?.auth.signOut();
}

// ─── Support Messages ─────────────────────────────────────────────────────────

export interface SupportMessage {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  subject: string;
  message: string;
  status: "open" | "replied" | "closed";
  admin_reply: string | null;
  created_at: string;
  replied_at: string | null;
}

export function subscribeAllSupportMessages(
  callback: (msgs: SupportMessage[]) => void
): () => void {
  if (!supabase) { callback([]); return () => {}; }
  const fetch = async () => {
    const { data } = await supabase!
      .from("support_messages")
      .select("*")
      .order("created_at", { ascending: false });
    callback((data ?? []) as SupportMessage[]);
  };
  fetch();
  const ch = supabase
    .channel("admin-support-all")
    .on("postgres_changes", { event: "*", schema: "public", table: "support_messages" }, fetch)
    .subscribe();
  return () => { supabase!.removeChannel(ch); };
}

export async function replySupportMessage(id: string, reply: string): Promise<void> {
  if (!supabase) return;
  await supabase!.from("support_messages").update({
    admin_reply: reply,
    status: "replied",
    replied_at: new Date().toISOString(),
  }).eq("id", id);
}

export async function closeSupportMessage(id: string): Promise<void> {
  if (!supabase) return;
  await supabase!.from("support_messages").update({ status: "closed" }).eq("id", id);
}

// ─── Notifications (send to user) ────────────────────────────────────────────

export async function sendNotificationToUser(
  userId: string,
  notif: { title: string; body: string; type?: string }
): Promise<void> {
  if (!supabase) return;
  await supabase!.from("notifications").insert({
    user_id: userId,
    title: notif.title,
    body: notif.body,
    type: notif.type ?? "general",
    read: false,
  });
}

export function onAuthStateChange(cb: (user: User | null) => void) {
  if (!supabase) { cb(null); return () => {}; }
  // onAuthStateChange fires INITIAL_SESSION on startup — getSession() is redundant
  // and causes a double-callback race that can re-trigger auth teardown/setup.
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
    cb(session?.user ?? null);
  });
  return () => subscription.unsubscribe();
}
