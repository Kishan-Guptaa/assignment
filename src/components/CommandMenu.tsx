"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Compass, Shield, ShieldAlert, ShoppingBag, LogOut, Check } from "lucide-react";
import { getCurrentUser, quickLoginDemo } from "@/lib/actions/auth";
import { getProductsList } from "@/lib/actions/inventoryActions";

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandMenu({ isOpen, onClose }: CommandMenuProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeUser, setActiveUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);

  const menuRef = useRef<HTMLDivElement>(null);

  async function loadData() {
    try {
      const user = await getCurrentUser();
      setActiveUser(user);
      const pList = await getProductsList();
      setProducts(pList);
    } catch (e) {
      console.error("Error loading CommandMenu metrics:", e);
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filtered lists
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const navigateTo = (path: string) => {
    router.push(path);
    onClose();
  };

  const handleRoleSwitch = async (email: string) => {
    await quickLoginDemo(email);
    onClose();
    // Redirect based on role and reload page to refresh session contexts
    if (email.includes("admin")) {
      router.push("/admin");
    } else if (email.includes("seller")) {
      router.push("/seller");
    } else {
      router.push("/customer");
    }
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300">
      <div
        ref={menuRef}
        className="w-full max-w-lg overflow-hidden scribble-card bg-card shadow-2xl shadow-slate-950/30 transition-all transform scale-100 font-scribble text-slate-900 dark:text-slate-100"
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b-2 border-slate-900 dark:border-slate-200 bg-slate-50/30 dark:bg-slate-900/30">
          <Search className="w-5 h-5 mr-3 text-slate-405 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Type a command or search chemicals..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-450 focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {/* Content list */}
        <div className="max-h-[350px] overflow-y-auto p-2 scrollbar-thin">
          {/* Navigation Section */}
          <div className="mb-4">
            <h3 className="px-3 py-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Navigation
            </h3>
            <div className="space-y-0.5">
              <button
                onClick={() => navigateTo("/")}
                className="w-full flex items-center px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <Compass className="w-4 h-4 mr-3 text-slate-400" />
                <span>Go to Home Page</span>
              </button>
              {activeUser?.role === "admin" && (
                <button
                  onClick={() => navigateTo("/admin")}
                  className="w-full flex items-center px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <Shield className="w-4 h-4 mr-3 text-violet-500" />
                  <span>Go to Admin Dashboard</span>
                </button>
              )}
              {activeUser?.role === "seller" && (
                <button
                  onClick={() => navigateTo("/seller")}
                  className="w-full flex items-center px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4 mr-3 text-emerald-500" />
                  <span>Go to Seller Dashboard</span>
                </button>
              )}
              <button
                onClick={() => navigateTo("/customer")}
                className="w-full flex items-center px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 mr-3 text-blue-500" />
                <span>Go to Customer Storefront</span>
              </button>
            </div>
          </div>

          {/* Quick Role Switchers */}
          <div className="mb-4">
            <h3 className="px-3 py-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Simulate Users / Roles
            </h3>
            <div className="space-y-0.5">
              <button
                onClick={() => handleRoleSwitch("admin@aasamedchem.com")}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-600 mr-3" />
                  <span>Dr. Clara Sterling (Admin)</span>
                </div>
                {activeUser?.role === "admin" && <Check className="w-4 h-4 text-violet-500" />}
              </button>
              <button
                onClick={() => handleRoleSwitch("seller@aasamedchem.com")}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 mr-3" />
                  <span>Apex Reagents Ltd. (Seller)</span>
                </div>
                {activeUser?.role === "seller" && <Check className="w-4 h-4 text-emerald-500" />}
              </button>
              <button
                onClick={() => handleRoleSwitch("customer@labtech.com")}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 mr-3" />
                  <span>Biotech Innovations Inc. (Customer)</span>
                </div>
                {activeUser?.role === "customer" && <Check className="w-4 h-4 text-blue-500" />}
              </button>
            </div>
          </div>

          {/* Chemical Search Results */}
          <div>
            <h3 className="px-3 py-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Chemicals / Products
            </h3>
            {filteredProducts.length > 0 ? (
              <div className="space-y-0.5">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      navigateTo(`/customer?search=${product.name}`);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left cursor-pointer"
                  >
                    <div>
                      <div className="font-medium text-slate-800 dark:text-slate-200">{product.name}</div>
                      <div className="text-xs text-slate-400">{product.sku}</div>
                    </div>
                    <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">
                      ₹{product.basePrice.toFixed(2)}/{product.baseUnit}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-3 py-4 text-center text-sm text-slate-400">
                No chemical items matching &ldquo;{search}&rdquo;
              </div>
            )}
          </div>
        </div>

        {/* Footer shortcuts info */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-[10px] text-slate-400 font-mono">
          <div>Press ESC to close</div>
          <div className="flex items-center gap-1">
            <span>Role Swap</span>
            <kbd className="px-1 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded text-slate-500">Click Row</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}

