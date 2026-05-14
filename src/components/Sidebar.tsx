import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, ShoppingBag, Users, Package,
  Repeat, Truck, Droplets, X, LogOut, Settings,
  Tag, LayoutList, FileImage,
} from "lucide-react";

const nav = [
  { to: "/",             icon: LayoutDashboard, label: "Dashboard"     },
  { to: "/orders",       icon: ShoppingBag,     label: "Orders"        },
  { to: "/customers",    icon: Users,           label: "Customers"     },
  { to: "/products",     icon: Package,         label: "Products"      },
  { to: "/categories",   icon: Tag,             label: "Categories"    },
  { to: "/plans",        icon: LayoutList,      label: "Plans"         },
  { to: "/subscriptions",icon: Repeat,          label: "Subscriptions" },
  { to: "/drivers",      icon: Truck,           label: "Drivers"       },
  { to: "/content",      icon: FileImage,       label: "Content"       },
];

interface Props { open: boolean; onClose: () => void; }

export function Sidebar({ open, onClose }: Props) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-slate-900 flex flex-col z-40
        transform transition-transform duration-300 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full"}
        lg:relative lg:translate-x-0 lg:flex-shrink-0
      `}>
        {/* Brand */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
              <Droplets className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white leading-none">AquaPure</p>
              <p className="text-[10px] text-slate-400 font-medium">Admin Console</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`
              }
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" style={{ height: 18, width: 18 }} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-slate-700/50 space-y-0.5">
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`
            }
          >
            <Settings className="h-[18px] w-[18px] shrink-0" />
            Settings
          </NavLink>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all">
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
