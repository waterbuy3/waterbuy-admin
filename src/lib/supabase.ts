import { createClient, type User } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const isSupabaseConfigured =
  !!supabaseUrl &&
  supabaseUrl !== "REPLACE_ME" &&
  supabaseUrl !== "undefined";

export const isConfigured = isSupabaseConfigured;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export type { User };

export async function adminSignIn(email: string, password: string): Promise<string | null> {
  if (!supabase) return "Supabase not configured";
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? error.message : null;
}

export async function adminSignOut(): Promise<void> {
  await supabase?.auth.signOut();
}

export function onAuthStateChange(cb: (user: User | null) => void) {
  if (!supabase) { cb(null); return () => {}; }
  supabase.auth.getSession().then(({ data }) => cb(data.session?.user ?? null));
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
    cb(session?.user ?? null);
  });
  return () => subscription.unsubscribe();
}
