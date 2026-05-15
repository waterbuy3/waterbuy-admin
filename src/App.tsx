import { useState, useEffect } from "react";
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
import { Login } from "@/pages/Login";
import { VendorDashboard } from "@/pages/VendorDashboard";
import { Vendors } from "@/pages/Vendors";
import { VendorOrders } from "@/pages/VendorOrders";
import { VendorProducts } from "@/pages/VendorProducts";
import { VendorPayouts } from "@/pages/VendorPayouts";
import { onAuthStateChange, type User } from "@/lib/supabase";

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-100/60 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            {/* User App */}
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
            {/* Vendor */}
            <Route path="/vendor-dashboard" element={<VendorDashboard />} />
            <Route path="/vendors"          element={<Vendors />} />
            <Route path="/vendor-orders"    element={<VendorOrders />} />
            <Route path="/vendor-products"  element={<VendorProducts />} />
            <Route path="/vendor-payouts"   element={<VendorPayouts />} />
            <Route path="*"              element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const unsub = onAuthStateChange(setUser);
    return unsub;
  }, []);

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {user ? (
          <Route path="/*" element={<Layout />} />
        ) : (
          <Route path="/*" element={<Login />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}
