"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FlaskConical,
  Boxes,
  FileText,
  ClipboardList,
  Home,
  ChevronLeft,
  ChevronRight,
  ShoppingBag
} from "lucide-react";
import { getCurrentUser } from "@/lib/actions/auth";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [dbUser, setDbUser] = useState<any>(null);

  useEffect(() => {
    async function loadUser() {
      const user = await getCurrentUser();
      setDbUser(user);
    }
    loadUser();
  }, [pathname]); // Reload when path changes (session checks updates)

  const navigateTo = (path: string) => {
    router.push(path);
  };

  // Helper to check if a route is active
  const isActive = (path: string) => pathname === path;

  // Render navigation links based on roles
  const getNavItems = () => {
    if (!dbUser) return [{ label: "Home", icon: Home, path: "/" }];

    switch (dbUser.role) {
      case "admin":
        return [
          { label: "Admin Console", icon: LayoutDashboard, path: "/admin" },
          { label: "Products Database", icon: FlaskConical, path: "/admin/products" },
          { label: "Quotation Requests", icon: FileText, path: "/admin/quotations" },
          { label: "Orders Pipeline", icon: ClipboardList, path: "/admin/orders" },
        ];
      case "seller":
        return [
          { label: "Seller Analytics", icon: LayoutDashboard, path: "/seller" },
          { label: "Own Products", icon: FlaskConical, path: "/admin/products" },
          { label: "Quotations Inbox", icon: FileText, path: "/admin/quotations" },
          { label: "Orders Fulfilment", icon: ClipboardList, path: "/admin/orders" },
        ];
      case "customer":
        return [
          { label: "Chemical Storefront", icon: ShoppingBag, path: "/customer" },
        ];
      default:
        return [{ label: "Home", icon: Home, path: "/" }];
    }
  };

  const navItems = getNavItems();

  return (
    <aside
      className={`fixed lg:sticky top-16 left-0 h-[calc(100vh-64px)] z-30 transition-all duration-300 border-r-2 border-slate-900 dark:border-slate-200 bg-card flex flex-col justify-between font-scribble ${
        isOpen ? "w-64" : "w-16"
      } ${!isOpen ? "hidden lg:flex" : "flex"}`}
    >
      {/* Upper Navigation Links */}
      <div className="py-4 overflow-y-auto overflow-x-hidden flex-1 scrollbar-thin">
        {dbUser && (
          <div className={`px-4 mb-6 transition-all ${isOpen ? "opacity-100" : "opacity-0 lg:hidden"}`}>
            <div className="p-3 scribble-border bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-3">
              <div className={`w-8 h-8 scribble-border flex items-center justify-center text-white font-bold text-xs ${
                dbUser.role === "admin" ? "bg-violet-600" : dbUser.role === "seller" ? "bg-emerald-600" : "bg-blue-600"
              }`}>
                {dbUser.role.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                  {dbUser.name}
                </div>
                <div className="text-[10px] text-slate-400 capitalize font-medium">{dbUser.role} Portal</div>
              </div>
            </div>
          </div>
        )}

        <nav className="px-2 space-y-1.5">
          {/* Main Links */}
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigateTo(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group relative ${
                  active
                    ? "text-violet-600 dark:text-violet-400 font-bold border-b-2 border-dashed border-violet-600"
                    : "text-slate-500 dark:text-slate-455 hover:text-slate-850"
                }`}
                title={!isOpen ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 transition-colors ${
                  active ? "text-violet-600 dark:text-violet-400" : "text-slate-400 group-hover:text-slate-500"
                }`} />
                <span className={`transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0 lg:hidden"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}

          <div className="border-t border-slate-100 dark:border-slate-800 my-4" />

          {/* Standard Portal Utilities */}
          <button
            onClick={() => navigateTo("/")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 ${
              isActive("/") ? "font-bold text-violet-600" : ""
            }`}
            title="Landing Home"
          >
            <Home className="w-4 h-4 text-slate-400" />
            <span className={`transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0 lg:hidden"}`}>
              Landing Page
            </span>
          </button>
        </nav>
      </div>

      {/* Collapse Trigger at bottom */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-905 hover:text-slate-600 dark:hover:text-slate-200 transition-colors hidden lg:flex"
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
