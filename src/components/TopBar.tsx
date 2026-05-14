import { Menu, Bell, Search, LogOut } from "lucide-react";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { adminSignOut } from "@/lib/supabase";

const ROUTE_TITLES: Record<string, string> = {
  "/":              "Dashboard",
  "/orders":        "Orders",
  "/customers":     "Customers",
  "/products":      "Products",
  "/subscriptions": "Subscriptions",
  "/drivers":       "Drivers",
  "/settings":      "Settings",
};

interface Props { onMenuClick: () => void; }

export function TopBar({ onMenuClick }: Props) {
  const [query, setQuery] = useState("");
  const { pathname } = useLocation();
  const title = ROUTE_TITLES[pathname] ?? "Admin";

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center gap-4">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="text-base font-bold text-slate-900 lg:text-lg">{title}</h1>

      <div className="flex-1 max-w-sm ml-4 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search orders, customers…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
        </button>

        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <span className="text-xs font-extrabold text-white">AD</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-slate-900 leading-none">Admin</p>
            <p className="text-[10px] text-slate-400">Super Admin</p>
          </div>
          <button
            onClick={adminSignOut}
            title="Sign out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
