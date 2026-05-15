interface SkeletonProps { className?: string; }

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`bg-slate-200/70 rounded animate-pulse ${className}`} />;
}

/** Rows of <tr> placeholders matching N columns. */
export function TableSkeleton({ rows = 6, cols }: { rows?: number; cols: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-slate-50">
          {Array.from({ length: cols }).map((__, c) => (
            <td key={c} className="px-4 py-3.5">
              <Skeleton className="h-3 w-3/4" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/** Generic card-ish skeleton block. */
export function CardSkeleton({ height = 80 }: { height?: number }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-200/70" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-slate-200/70 rounded w-1/2" />
          <div className="h-3 bg-slate-200/70 rounded w-1/3" />
        </div>
      </div>
      {height > 80 && <div className="mt-3 h-3 bg-slate-200/70 rounded w-full" />}
    </div>
  );
}
