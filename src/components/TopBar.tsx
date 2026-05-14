import { Menu, Bell, Search, LogOut } from "lucide-react";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { adminSignOut } from "@/lib/supabase";

const ROUTE_TITLES: Record<string, string> = {
  "/":              "Dashboard",
  "/orders":        "Orders",
  "/customers":     "Customers",
  "/products":      "Products",
  "/categories":    "Categories",
  "/plans":         "Plans",
  "/subscriptions": "Subscriptions",
  "/drivers":       "Drivers",
  "/content":       "Content",
  "/settings":      "Settings",
};

interface Props { onMenuClick: () => void; }

export function TopBar({ onMenuClick }: Props) {
  const [query, setQuery] = useState("");
  const { pathname } = useLocation();
  const title = ROUTE_TITLES[pathname] ?? "Admin";

  return (
    <header className="sticky top-0 z-20 h-[56px] bg-white border-b border-slate-200/80 px-4 lg:px-6 flex items-center gap-3 shrink-0">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="text-[15px] font-semibold text-slate-900 tracking-[-0.01em]">{title}</h1>

      <div className="flex-1 max-w-[280px] ml-3 hidden md:block">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-full pl-8 pr-3 py-[6px] text-[13px] bg-slate-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:bg-white transition-all placeholder:text-slate-400 font-medium"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell style={{ height: 17, width: 17 }} />
          <span className="absolute top-[9px] right-[9px] w-1.5 h-1.5 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <div className="flex items-center gap-2 pl-3 ml-1 border-l border-slate-200">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-violet-500 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-white leading-none">AD</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-[12px] font-semibold text-slate-900 leading-none">Admin</p>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-none">Super Admin</p>
          </div>
          <button
            onClick={adminSignOut}
            title="Sign out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors ml-0.5"
          >
            <LogOut style={{ height: 14, width: 14 }} />
          </button>
        </div>
      </div>
    </header>
  );
}
