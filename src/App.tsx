import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { Dashboard } from "@/pages/Dashboard";
import { Orders } from "@/pages/Orders";
import { Customers } from "@/pages/Customers";
import { Products } from "@/pages/Products";
import { Categories } from "@/pages/Categories";
import { Plans } from "@/pages/Plans";
import { Subscriptions } from "@/pages/Subscriptions";
import { Drivers } from "@/pages/Drivers";
import { Content } from "@/pages/Content";
import { Settings } from "@/pages/Settings";

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/"              element={<Dashboard />} />
            <Route path="/orders"        element={<Orders />} />
            <Route path="/customers"     element={<Customers />} />
            <Route path="/products"      element={<Products />} />
            <Route path="/categories"    element={<Categories />} />
            <Route path="/plans"         element={<Plans />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/content"       element={<Content />} />
            <Route path="/drivers"       element={<Drivers />} />
            <Route path="/settings"      element={<Settings />} />
            <Route path="*"              element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<Layout />} />
      </Routes>
    </BrowserRouter>
  );
}
