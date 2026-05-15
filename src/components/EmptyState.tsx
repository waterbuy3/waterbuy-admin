import type { ElementType, ReactNode } from "react";

interface Props {
  icon: ElementType;
  title: string;
  message?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, message, action, className = "" }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
        <Icon className="h-7 w-7 text-slate-400" strokeWidth={1.6} />
      </div>
      <p className="text-sm font-bold text-slate-700">{title}</p>
      {message && <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
