import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";

interface CollectionOptions {
  orderBy?: string;
  ascending?: boolean;
  eq?: [string, unknown][];
}

export function useCollection<T extends { id: string }>(
  table: string,
  options: CollectionOptions = {},
): { data: T[]; loading: boolean; error: string | null; refetch: () => void } {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  // Stash options.eq in a ref so the dep array is stable
  const optRef = useRef(options);
  optRef.current = options;

  const fetchData = async () => {
    if (!supabase) { setLoading(false); return; }
    try {
      let q = supabase.from(table).select("*");
      for (const [col, val] of optRef.current.eq ?? []) q = q.eq(col, val);
      if (optRef.current.orderBy) {
        q = q.order(optRef.current.orderBy, { ascending: optRef.current.ascending ?? true });
      }
      const { data: rows, error: err } = await q;
      if (!mounted.current) return;
      if (err) {
        setError(err.message);
        setData([]);
      } else {
        setError(null);
        setData((rows ?? []) as T[]);
      }
    } catch (e) {
      if (!mounted.current) return;
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    mounted.current = true;
    if (!supabase) { setLoading(false); return; }

    fetchData();

    // Debounce rapid realtime events to avoid storm of refetches
    const channel = supabase
      .channel(`${table}-realtime`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => {
        if (refetchTimer.current) clearTimeout(refetchTimer.current);
        refetchTimer.current = setTimeout(() => { fetchData(); }, 150);
      })
      .subscribe();

    return () => {
      mounted.current = false;
      if (refetchTimer.current) clearTimeout(refetchTimer.current);
      supabase?.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  return { data, loading, error, refetch: fetchData };
}

export function useDocument<T>(table: string, id: string): { data: T | null; loading: boolean } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !id) { setLoading(false); return; }
    let mounted = true;

    const fetchData = async () => {
      if (!supabase) return;
      const { data: row } = await supabase.from(table).select("*").eq("id", id).single();
      if (!mounted) return;
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

    return () => { mounted = false; supabase?.removeChannel(channel); };
  }, [table, id]);

  return { data, loading };
}

// ─── CRUD helpers ─────────────────────────────────────────────────────────────

export async function db_add(table: string, data: Record<string, unknown>): Promise<string | null> {
  if (!supabase) return null;
  const { data: row, error } = await supabase.from(table).insert(data).select("id").single();
  if (error) throw error;
  return (row as { id: string } | null)?.id ?? null;
}

export async function db_set(
  table: string,
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from(table).upsert({ id, ...data }, { onConflict: "id" });
  if (error) throw error;
}

export async function db_update(
  table: string,
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from(table).update(data).eq("id", id);
  if (error) throw error;
}

export async function db_delete(table: string, id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

export async function db_get<T>(table: string, id: string): Promise<T | null> {
  if (!supabase) return null;
  const { data } = await supabase.from(table).select("*").eq("id", id).single();
  return data ? (data as T) : null;
}
