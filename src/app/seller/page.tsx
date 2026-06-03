"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  FlaskConical,
  Boxes,
  ClipboardList,
  AlertTriangle,
  PlusCircle,
  MessageSquare,
  DollarSign,
  ShieldAlert,
  Lock
} from "lucide-react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { getCurrentUser } from "@/lib/actions/auth";
import { getProductsList, adjustProductStock } from "@/lib/actions/inventoryActions";
import { getOrdersList } from "@/lib/actions/quotationActions";

// Recharts
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function SellerDashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Database-backed states
  const [activeUser, setActiveUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  // Quick Restock state
  const [restockProdId, setRestockProdId] = useState<number | null>(null);
  const [restockQty, setRestockQty] = useState<number>(100);

  // Load database tables
  async function loadData() {
    try {
      const user = await getCurrentUser();
      setActiveUser(user);
      if (user && user.role === "seller") {
        const pList = await getProductsList();
        setProducts(pList);
        const oList = await getOrdersList();
        setOrders(oList);
      }
    } catch (e) {
      console.error("Error loading seller dashboard data:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-scribble text-white">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-xs text-slate-400">Loading seller portal...</p>
        </div>
      </div>
    );
  }

  if (!activeUser) {
    if (mounted) router.push("/login");
    return null;
  }

  // Access guard
  if (activeUser.role !== "seller") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-scribble">
        <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col items-center scribble-card">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-6">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-white">Distributor Clearance Required</h1>
          <p className="mt-3 text-slate-400 text-xs leading-relaxed">
            Your current logged-in role is <span className="text-rose-450 capitalize font-semibold">{activeUser.role}</span>. You do not possess seller access to view this distributor workspace.
          </p>
          <div className="mt-8 flex gap-4 w-full">
            <button
              onClick={() => router.push("/login")}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-slate-950 font-black text-xs transition-colors scribble-button"
            >
              Log In as Seller
            </button>
            <button
              onClick={() => router.push(activeUser.role === "admin" ? "/admin" : "/customer")}
              className="flex-1 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-950 font-black text-xs transition-colors scribble-button"
            >
              Back to Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate stats for current seller
  const ownProducts = products.filter((p) => p.sellerId === activeUser.id);
  const ownProductsCount = ownProducts.length;
  const ownStockQuantity = ownProducts.reduce((acc, p) => acc + p.stockQuantity, 0);

  // Orders containing seller's products
  const ownOrders = orders.filter((o: any) =>
    o.items.some((item: any) => ownProducts.some((p: any) => p.id === item.productId))
  );
  const activeOrdersCount = ownOrders.filter((o: any) => o.status !== "Delivered" && o.status !== "Cancelled").length;

  // Revenue for seller based on their items in delivered/processed orders
  const ownRevenue = orders
    .filter((o: any) => o.status !== "Cancelled")
    .reduce((total: number, o: any) => {
      const orderSellerItems = o.items.filter((item: any) =>
        ownProducts.some((p: any) => p.id === item.productId)
      );
      const orderSellerTotal = orderSellerItems.reduce((sum: number, item: any) => sum + item.subtotal, 0);
      return total + orderSellerTotal;
    }, 0);

  const handleQuickRestock = async (productId: number, baseUnit: string) => {
    setSubmitting(true);
    const result = await adjustProductStock(productId, restockQty, baseUnit, "IN", "Quick Restock from Dashboard");
    if (result.success) {
      await loadData();
      setRestockProdId(null);
    } else {
      alert("Failed to adjust stock. Please try again.");
    }
    setSubmitting(false);
  };

  // Recharts Chart Data (Sales Trend for Seller)
  const salesTrendData = [
    { name: "Jan", Revenue: ownRevenue > 0 ? ownRevenue * 0.15 : 450 },
    { name: "Feb", Revenue: ownRevenue > 0 ? ownRevenue * 0.35 : 950 },
    { name: "Mar", Revenue: ownRevenue > 0 ? ownRevenue * 0.6 : 1400 },
    { name: "Apr", Revenue: ownRevenue > 0 ? ownRevenue * 0.8 : 2200 },
    { name: "May", Revenue: ownRevenue > 0 ? ownRevenue : 3100 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-scribble">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex relative">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-[1600px] mx-auto w-full space-y-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl text-slate-900 dark:text-white">Seller Analytics Console</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage listings performance and restock critical reagents</p>
          </div>

          {/* STATS GRID */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-card scribble-card flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Own Catalog Listings</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{ownProductsCount}</div>
                <p className="text-[10px] text-slate-400 mt-1">Active compounds</p>
              </div>
              <FlaskConical className="w-8 h-8 text-violet-500 opacity-60" />
            </div>
            <div className="p-5 bg-card scribble-card flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Warehoused Stock</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{ownStockQuantity.toFixed(0)}</div>
                <p className="text-[10px] text-slate-400 mt-1">Units logged</p>
              </div>
              <Boxes className="w-8 h-8 text-emerald-500 opacity-60" />
            </div>
            <div className="p-5 bg-card scribble-card flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Customer Orders</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{activeOrdersCount}</div>
                <p className="text-[10px] text-slate-400 mt-1">Fulfillment pending</p>
              </div>
              <ClipboardList className="w-8 h-8 text-blue-500 opacity-60" />
            </div>
            <div className="p-5 bg-card scribble-card bg-gradient-to-br from-violet-500/10 to-indigo-500/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-violet-600 dark:text-violet-400 tracking-wider">Store Revenue</span>
                <div className="text-2xl font-black text-violet-600 dark:text-violet-400 mt-1">₹{ownRevenue.toFixed(2)}</div>
                <p className="text-[10px] text-slate-400 mt-1">Net sales value</p>
              </div>
              <DollarSign className="w-8 h-8 text-violet-500 opacity-80" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* RECHARTS AREA CHART */}
            <div className="lg:col-span-2 p-5 bg-card scribble-card flex flex-col justify-between">
              <div className="mb-4 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-violet-500" />
                  Your Storefront Sales Trend
                </h3>
              </div>
              {mounted && (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesTrendData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: "#0F172A", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px" }} />
                      <Area type="monotone" dataKey="Revenue" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* QUICK RESTOCK / STOCK SHORTAGES PANEL */}
            <div className="p-5 bg-card scribble-card flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Shortage Alerts &amp; Top-Up
                </h3>

                <div className="space-y-3 overflow-y-auto max-h-56 scrollbar-thin">
                  {ownProducts.length > 0 ? (
                    ownProducts.map((p) => {
                      const isLow = p.stockQuantity < p.minimumStock;
                      return (
                        <div
                          key={p.id}
                          className={`p-3 rounded-lg border flex items-center justify-between text-xs transition-colors ${isLow
                              ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                              : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                            }`}
                        >
                          <div>
                            <div className="font-semibold">{p.name}</div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              Stock: {p.stockQuantity.toFixed(2)} {p.baseUnit} (Min: {p.minimumStock})
                            </div>
                          </div>

                          {restockProdId === p.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                className="w-12 bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded px-1.5 py-0.8 text-[10px] focus:outline-none"
                                value={restockQty}
                                onChange={(e) => setRestockQty(parseFloat(e.target.value) || 0)}
                              />
                              <button
                                onClick={() => handleQuickRestock(p.id, p.baseUnit)}
                                disabled={submitting}
                                className="px-2 py-1 bg-violet-600 text-slate-950 font-black rounded text-[10px] scribble-button cursor-pointer disabled:opacity-60"
                              >
                                {submitting ? "..." : "Add"}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setRestockProdId(p.id);
                                setRestockQty(100);
                              }}
                              className="p-1 text-violet-600 hover:bg-violet-100 dark:hover:bg-violet-950/20 rounded transition-colors inline-flex"
                              title="Quick Restock"
                            >
                              <PlusCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-10 text-slate-400">No storefront listings created.</div>
                  )}
                </div>
              </div>

              <button
                onClick={() => router.push("/admin/products")}
                className="w-full mt-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-950 font-black rounded-lg text-[10px] scribble-button"
              >
                Go to Catalog Database
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* INCOMING RECENT ORDERS involving seller catalog */}
            <div className="p-5 bg-card scribble-card">
              <h3 className="font-bold text-slate-850 dark:text-white flex items-center gap-2 mb-4">
                <ClipboardList className="w-5 h-5 text-violet-500" />
                Recent Orders Fulfillments
              </h3>

              <div className="space-y-2 overflow-y-auto max-h-60 scrollbar-thin">
                {ownOrders.length > 0 ? (
                  ownOrders.map((o: any) => {
                    const sellerSubtotal = o.items
                      .filter((item: any) => ownProducts.some((p: any) => p.id === item.productId))
                      .reduce((sum: number, item: any) => sum + item.subtotal, 0);

                    return (
                      <div
                        key={o.id}
                        className="p-3 rounded-lg border dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between text-xs cursor-pointer"
                        onClick={() => router.push("/admin/orders")}
                      >
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{o.orderNumber}</div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            Status: <span className="uppercase font-bold text-violet-500">{o.status}</span> &bull; Your Shares: ₹{sellerSubtotal.toFixed(2)}
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(o.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs">No orders received yet.</div>
                )}
              </div>
            </div>

            {/* SIMULATED FEEDBACK / MESSAGES BOX */}
            <div className="p-5 bg-card scribble-card flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-850 dark:text-white flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-violet-500" />
                  Customer Feedback Box
                </h3>

                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 text-xs">
                    <div className="flex justify-between font-semibold text-slate-800 dark:text-slate-200">
                      <span>Biotech Innovations Inc.</span>
                      <span className="text-[10px] text-slate-400">2 hrs ago</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mt-1.5 leading-normal">
                      &ldquo;The Palladium catalyst arrived in high purity and dry condition. Packing was excellent.&rdquo;
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 text-xs">
                    <div className="flex justify-between font-semibold text-slate-800 dark:text-slate-200">
                      <span>Standard Pharma Lab</span>
                      <span className="text-[10px] text-slate-400">Yesterday</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mt-1.5 leading-normal">
                      &ldquo;Are there bulk discounts available if we order more than 20 Liters of Acetonitrile HPLC grade next time?&rdquo;
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 text-center mt-4">
                Chat interface sandbox &bull; Auto responses active
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
