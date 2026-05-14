import { useEffect, useState } from "react";
import { supabase } from "./supabase";

interface CollectionOptions {
  orderBy?: string;
  ascending?: boolean;
  eq?: [string, unknown][];
}

export function useCollection<T extends { id: string }>(
  table: string,
  options: CollectionOptions = {},
): { data: T[]; loading: boolean } {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }

    const fetchData = async () => {
      if (!supabase) return;
      let q = supabase.from(table).select("*");
      for (const [col, val] of options.eq ?? []) {
        q = q.eq(col, val);
      }
      if (options.orderBy) {
        q = q.order(options.orderBy, { ascending: options.ascending ?? true });
      }
      const { data: rows } = await q;
      setData((rows ?? []) as T[]);
      setLoading(false);
    };

    fetchData();

    const channel = supabase
      .channel(`${table}-realtime`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => fetchData())
      .subscribe();

    return () => { supabase?.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  return { data, loading };
}

export function useDocument<T>(table: string, id: string): { data: T | null; loading: boolean } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !id) { setLoading(false); return; }

    const fetchData = async () => {
      if (!supabase) return;
      const { data: row } = await supabase.from(table).select("*").eq("id", id).single();
      setData(row ? (row as T) : null);
      setLoading(false);
    };

    fetchData();

    const channel = supabase
      .channel(`${table}-${id}-realtime`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: `id=eq.${id}` },
        () => fetchData(),
      )
      .subscribe();

    return () => { supabase?.removeChannel(channel); };
  }, [table, id]);

  return { data, loading };
}

// ─── CRUD helpers ─────────────────────────────────────────────────────────────

export async function db_add(table: string, data: Record<string, unknown>): Promise<string | null> {
  if (!supabase) return null;
  const { data: row } = await supabase.from(table).insert(data).select("id").single();
  return (row as { id: string } | null)?.id ?? null;
}

export async function db_set(
  table: string,
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  if (!supabase) return;
  await supabase.from(table).upsert({ id, ...data }, { onConflict: "id" });
}

export async function db_update(
  table: string,
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  if (!supabase) return;
  await supabase.from(table).update(data).eq("id", id);
}

export async function db_delete(table: string, id: string): Promise<void> {
  if (!supabase) return;
  await supabase.from(table).delete().eq("id", id);
}

export async function db_get<T>(table: string, id: string): Promise<T | null> {
  if (!supabase) return null;
  const { data } = await supabase.from(table).select("*").eq("id", id).single();
  return data ? (data as T) : null;
}
