import { useState, useRef, useEffect } from "react";
import { Filter, X, ChevronDown, Plus } from "lucide-react";

// ─── Column definitions ───────────────────────────────────────────────────────

export type ColDef =
  | { key: string; label: string; type: "text"; placeholder?: string }
  | { key: string; label: string; type: "select"; options: { value: string; label: string }[] }
  | { key: string; label: string; type: "number-range"; prefix?: string }
  | { key: string; label: string; type: "date-range" };

export type ActiveFilter =
  | { type: "text"; value: string }
  | { type: "select"; value: string; label: string }
  | { type: "number-range"; min?: string; max?: string }
  | { type: "date-range"; from?: string; to?: string };

export type FilterMap = Record<string, ActiveFilter>;

// ─── Filter chip label ────────────────────────────────────────────────────────

function chipLabel(col: ColDef, filter: ActiveFilter): string {
  switch (filter.type) {
    case "text":         return `${col.label}: "${filter.value}"`;
    case "select":       return `${col.label}: ${filter.label}`;
    case "number-range": {
      const pre = (col as { prefix?: string }).prefix ?? "";
      if (filter.min && filter.max) return `${col.label}: ${pre}${filter.min} – ${pre}${filter.max}`;
      if (filter.min) return `${col.label}: ≥ ${pre}${filter.min}`;
      return `${col.label}: ≤ ${pre}${filter.max}`;
    }
    case "date-range": {
      const fmt = (s?: string) => s ? new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "";
      if (filter.from && filter.to) return `${col.label}: ${fmt(filter.from)} – ${fmt(filter.to)}`;
      if (filter.from) return `${col.label}: from ${fmt(filter.from)}`;
      return `${col.label}: until ${fmt(filter.to)}`;
    }
  }
}

// ─── Inline editor for a single column ───────────────────────────────────────

function FilterEditor({
  col,
  initial,
  onApply,
  onCancel,
}: {
  col: ColDef;
  initial?: ActiveFilter;
  onApply: (f: ActiveFilter) => void;
  onCancel: () => void;
}) {
  const [text, setText]   = useState((initial as { value?: string })?.value ?? "");
  const [sel, setSel]     = useState((initial as { value?: string })?.value ?? "");
  const [min, setMin]     = useState((initial as { min?: string })?.min ?? "");
  const [max, setMax]     = useState((initial as { max?: string })?.max ?? "");
  const [from, setFrom]   = useState((initial as { from?: string })?.from ?? "");
  const [to, setTo]       = useState((initial as { to?: string })?.to ?? "");

  const inp = "px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

  const canApply = () => {
    if (col.type === "text")         return text.trim().length > 0;
    if (col.type === "select")       return sel !== "";
    if (col.type === "number-range") return min !== "" || max !== "";
    if (col.type === "date-range")   return from !== "" || to !== "";
    return false;
  };

  const apply = () => {
    if (!canApply()) return;
    if (col.type === "text")   { onApply({ type: "text", value: text.trim() }); return; }
    if (col.type === "select") {
      const opt = col.options.find((o) => o.value === sel);
      onApply({ type: "select", value: sel, label: opt?.label ?? sel });
      return;
    }
    if (col.type === "number-range") { onApply({ type: "number-range", min: min || undefined, max: max || undefined }); return; }
    if (col.type === "date-range")   { onApply({ type: "date-range", from: from || undefined, to: to || undefined }); return; }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-semibold text-slate-600 shrink-0">{col.label}:</span>

      {col.type === "text" && (
        <input autoFocus value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") apply(); if (e.key === "Escape") onCancel(); }}
          placeholder={col.placeholder ?? "Type to filter…"}
          className={`${inp} w-40`} />
      )}

      {col.type === "select" && (
        <select autoFocus value={sel} onChange={(e) => setSel(e.target.value)} className={`${inp} min-w-[140px]`}>
          <option value="">Select…</option>
          {col.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}

      {col.type === "number-range" && (
        <>
          <input type="number" value={min} onChange={(e) => setMin(e.target.value)}
            placeholder="Min" className={`${inp} w-24`} />
          <span className="text-xs text-slate-400">–</span>
          <input type="number" value={max} onChange={(e) => setMax(e.target.value)}
            placeholder="Max" className={`${inp} w-24`} />
        </>
      )}

      {col.type === "date-range" && (
        <>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={`${inp} w-36`} />
          <span className="text-xs text-slate-400">–</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={`${inp} w-36`} />
        </>
      )}

      <button onClick={apply} disabled={!canApply()}
        className="px-2.5 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg disabled:opacity-40 hover:bg-indigo-700 transition-colors">
        Apply
      </button>
      <button onClick={onCancel} className="px-2.5 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors">
        Cancel
      </button>
    </div>
  );
}

// ─── Column picker dropdown ───────────────────────────────────────────────────

function ColumnPicker({
  columns,
  active,
  onPick,
  onClose,
}: {
  columns: ColDef[];
  active: Set<string>;
  onPick: (col: ColDef) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl border border-slate-200 shadow-lg z-50 overflow-hidden">
      {columns.map((col) => (
        <button key={col.key} onClick={() => { onPick(col); onClose(); }}
          className={`w-full px-3 py-2 text-left text-xs font-semibold transition-colors flex items-center justify-between ${
            active.has(col.key) ? "text-slate-300 cursor-default" : "text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
          }`}
          disabled={active.has(col.key)}>
          {col.label}
          {active.has(col.key) && <span className="text-[10px] text-slate-300">active</span>}
        </button>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface MultiFilterProps {
  columns: ColDef[];
  value: FilterMap;
  onChange: (filters: FilterMap) => void;
}

export function MultiFilter({ columns, value, onChange }: MultiFilterProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [editing,    setEditing]    = useState<ColDef | null>(null);
  const activeKeys = new Set(Object.keys(value));
  const activeCount = activeKeys.size;

  const addFilter = (filter: ActiveFilter, key: string) => {
    onChange({ ...value, [key]: filter });
    setEditing(null);
  };

  const removeFilter = (key: string) => {
    const next = { ...value };
    delete next[key];
    onChange(next);
    if (editing?.key === key) setEditing(null);
  };

  const clearAll = () => { onChange({}); setEditing(null); };

  const colMap = Object.fromEntries(columns.map((c) => [c.key, c]));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Filter icon + count */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 shrink-0">
        <Filter className="h-3.5 w-3.5" />
        Filters{activeCount > 0 && (
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-extrabold">
            {activeCount}
          </span>
        )}
      </div>

      {/* Active filter chips */}
      {Object.entries(value).map(([key, filter]) => {
        const col = colMap[key];
        if (!col) return null;
        return (
          <button key={key} onClick={() => setEditing(col)}
            className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors group">
            {chipLabel(col, filter)}
            <span onClick={(e) => { e.stopPropagation(); removeFilter(key); }}
              className="p-0.5 rounded hover:bg-indigo-200 text-indigo-400 hover:text-indigo-700 transition-colors">
              <X className="h-3 w-3" />
            </span>
          </button>
        );
      })}

      {/* Inline editor for new or existing filter */}
      {editing && (
        <FilterEditor
          col={editing}
          initial={value[editing.key]}
          onApply={(f) => addFilter(f, editing.key)}
          onCancel={() => setEditing(null)}
        />
      )}

      {/* Add filter button + picker */}
      {!editing && (
        <div className="relative">
          <button onClick={() => setShowPicker((v) => !v)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-500 border border-dashed border-slate-300 rounded-lg hover:border-indigo-400 hover:text-indigo-600 transition-colors">
            <Plus className="h-3 w-3" /> Add Filter <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
          {showPicker && (
            <ColumnPicker
              columns={columns}
              active={activeKeys}
              onPick={(col) => { setEditing(col); setShowPicker(false); }}
              onClose={() => setShowPicker(false)}
            />
          )}
        </div>
      )}

      {/* Clear all */}
      {activeCount > 0 && !editing && (
        <button onClick={clearAll} className="text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors">
          Clear all
        </button>
      )}
    </div>
  );
}

// ─── Filter application helper ────────────────────────────────────────────────

export function matchesFilters(
  row: Record<string, unknown>,
  filters: FilterMap,
  resolve?: (key: string, row: Record<string, unknown>) => unknown,
): boolean {
  for (const [key, filter] of Object.entries(filters)) {
    const raw = resolve ? resolve(key, row) : row[key];
    const val = raw == null ? "" : String(raw);

    if (filter.type === "text") {
      if (!val.toLowerCase().includes(filter.value.toLowerCase())) return false;
    }
    if (filter.type === "select") {
      if (val !== filter.value) return false;
    }
    if (filter.type === "number-range") {
      const n = parseFloat(val);
      if (isNaN(n)) return false;
      if (filter.min !== undefined && n < parseFloat(filter.min)) return false;
      if (filter.max !== undefined && n > parseFloat(filter.max)) return false;
    }
    if (filter.type === "date-range") {
      const d = new Date(val).getTime();
      if (isNaN(d)) return false;
      if (filter.from) {
        const fromD = new Date(filter.from).getTime();
        if (d < fromD) return false;
      }
      if (filter.to) {
        // include full "to" day
        const toD = new Date(filter.to).getTime() + 86_400_000 - 1;
        if (d > toD) return false;
      }
    }
  }
  return true;
}
