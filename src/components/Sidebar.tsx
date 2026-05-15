import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, ShoppingBag, Users, Package,
  Repeat, Truck, Droplets, X, LogOut, Settings,
  Tag, LayoutList, FileImage, Store,
  Wallet, BookOpen, ClipboardList, MessageCircle,
} from "lucide-react";
import { adminSignOut } from "@/lib/supabase";
import { useState, useEffect } from "react";

const USER_APP_GROUPS = [
  {
    label: "Main",
    items: [
      { to: "/",           icon: LayoutDashboard, label: "Dashboard"  },
      { to: "/orders",     icon: ShoppingBag,     label: "Orders"     },
      { to: "/customers",  icon: Users,           label: "Customers"  },
    ],
  },
  {
    label: "Catalog",
    items: [
      { to: "/products",   icon: Package,    label: "Products"   },
      { to: "/categories", icon: Tag,        label: "Categories" },
      { to: "/plans",      icon: LayoutList, label: "Plans"      },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/subscriptions", icon: Repeat,        label: "Subscriptions" },
      { to: "/drivers",       icon: Truck,         label: "Drivers"       },
      { to: "/content",       icon: FileImage,     label: "Content"       },
      { to: "/support",       icon: MessageCircle, label: "Support"       },
    ],
  },
];

const VENDOR_GROUPS = [
  {
    label: "Overview",
    items: [
      { to: "/vendor-dashboard", icon: LayoutDashboard, label: "Dashboard" },
    ],
  },
  {
    label: "Management",
    items: [
      { to: "/vendors",         icon: Store,        label: "Vendors & Settings" },
      { to: "/vendor-orders",   icon: ClipboardList,label: "Vendor Orders"      },
      { to: "/vendor-products", icon: BookOpen,     label: "Vendor Products"    },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/vendor-payouts", icon: Wallet, label: "Payouts" },
    ],
  },
];

const VENDOR_PATHS = ["/vendor-dashboard", "/vendors", "/vendor-orders", "/vendor-products", "/vendor-payouts"];

const linkClass = (isActive: boolean) =>
  `relative flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] font-medium transition-all duration-100 ${
    isActive
      ? "bg-white/[0.08] text-white"
      : "text-white/40 hover:text-white/75 hover:bg-white/[0.05]"
  }`;

interface Props { open: boolean; onClose: () => void; }

export function Sidebar({ open, onClose }: Props) {
  const location = useLocation();
  const isVendorRoute = VENDOR_PATHS.some((p) => location.pathname.startsWith(p));
  const [tab, setTab] = useState<"user" | "vendor">(isVendorRoute ? "vendor" : "user");

  useEffect(() => {
    if (VENDOR_PATHS.some((p) => location.pathname.startsWith(p))) {
      setTab("vendor");
    } else {
      setTab("user");
    }
  }, [location.pathname]);

  const groups = tab === "vendor" ? VENDOR_GROUPS : USER_APP_GROUPS;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-[220px] flex flex-col z-40
        bg-[#0c1122] border-r border-white/[0.07]
        transform transition-transform duration-300 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full"}
        lg:relative lg:translate-x-0 lg:flex-shrink-0
      `}>
        {/* Brand */}
        <div className="flex items-center justify-between px-4 h-[56px] border-b border-white/[0.07] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Droplets style={{ height: 16, width: 16 }} className="text-white" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-white tracking-tight leading-none">AquaPure</p>
              <p className="text-[10px] text-white/25 font-medium tracking-[0.1em] leading-tight">ADMIN</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-3 pt-3 pb-2 shrink-0">
          <div className="flex gap-1 p-1 bg-white/[0.05] rounded-xl">
            <button
              onClick={() => setTab("user")}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-extrabold transition-all ${
                tab === "user"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              User App
            </button>
            <button
              onClick={() => setTab("vendor")}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-extrabold transition-all ${
                tab === "vendor"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              Vendor
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-5 overflow-y-auto sidebar-scroll">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1 text-[10px] font-semibold text-white/20 uppercase tracking-[0.13em]">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    onClick={onClose}
                    className={({ isActive }) => linkClass(isActive)}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full ${tab === "vendor" ? "bg-indigo-400" : "bg-blue-400"}`} />
                        )}
                        <item.icon
                          style={{ height: 15, width: 15 }}
                          className="shrink-0"
                          strokeWidth={isActive ? 2.2 : 1.8}
                        />
                        {item.label}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-white/[0.07] space-y-0.5 shrink-0">
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) => linkClass(isActive)}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-blue-400" />
                )}
                <Settings style={{ height: 15, width: 15 }} className="shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
                Settings
              </>
            )}
          </NavLink>
          <button
            onClick={adminSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] font-medium text-white/40 hover:text-red-400 hover:bg-red-500/[0.08] transition-all duration-100"
          >
            <LogOut style={{ height: 15, width: 15 }} className="shrink-0" strokeWidth={1.8} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
