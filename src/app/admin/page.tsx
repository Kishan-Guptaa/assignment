"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  Users,
  FlaskConical,
  Boxes,
  TrendingUp,
  History,
  Scale,
  Trash2,
  UserX,
  UserCheck,
  Plus,
  Coins,
  FileCheck
} from "lucide-react";
import { getCurrentUser, getUsersList, signupUser } from "@/lib/actions/auth";
import {
  getProductsList,
  getUnitConversionsList,
  addUnitConversionRule,
  deleteUnitConversionRule,
  getActivityLogsList,
  getCategoriesList
} from "@/lib/actions/inventoryActions";
import { getOrdersList } from "@/lib/actions/quotationActions";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { toggleUserRole } from "@/lib/actions/adminActions";

// Recharts
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

export default function AdminDashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Database-backed states
  const [activeUser, setActiveUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [unitConversions, setUnitConversions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  // Form states for creating new user
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("password123");
  const [newUserRole, setNewUserRole] = useState<number>(3); // User
  const [newUserPhone, setNewUserPhone] = useState("");

  // Form states for conversion rules
  const [convCat, setConvCat] = useState<"weight" | "volume" | "count">("weight");
  const [convFrom, setConvFrom] = useState("");
  const [convTo, setConvTo] = useState("");
  const [convFactor, setConvFactor] = useState<number>(1);

  // Load database tables
  async function loadData() {
    try {
      const user = await getCurrentUser();
      setActiveUser(user);
      if (user && user.role === "admin") {
        const uList = await getUsersList();
        setUsers(uList);
        const pList = await getProductsList();
        setProducts(pList);
        const oList = await getOrdersList();
        setOrders(oList);
        const logs = await getActivityLogsList();
        setActivityLogs(logs);
        const conv = await getUnitConversionsList();
        setUnitConversions(conv);
        const cats = await getCategoriesList();
        setCategories(cats);
      }
    } catch (e) {
      console.error(e);
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
          <p className="text-xs text-slate-400">Connecting to Neon database...</p>
        </div>
      </div>
    );
  }

  if (!activeUser || activeUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-scribble">
        <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col items-center scribble-card">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-6">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-white">Admin Clearance Required</h1>
          <p className="mt-3 text-slate-400 text-xs">
            Your current logged-in session is not authorized to view the operational panel.
          </p>
          <div className="mt-8 flex gap-4 w-full">
            <button
              onClick={() => router.push("/login")}
              className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-slate-950 font-black rounded-lg scribble-button"
            >
              Sign In Admin
            </button>
            <button
              onClick={() => router.push(activeUser?.role === "seller" ? "/seller" : "/customer")}
              className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-950 font-black rounded-lg scribble-button"
            >
              Back to Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculations for dashboard
  const totalProductsCount = products.length;
  const totalInventoryStock = products.reduce((acc, p) => acc + p.stockQuantity, 0);
  const totalSellersCount = users.filter((u) => u.role === "seller").length;
  const totalUsersCount = users.length;
  const totalOrdersCount = orders.length;
  const revenueSum = orders
    .filter((o) => o.status !== "Cancelled")
    .reduce((acc, o) => acc + o.totalAmount, 0);

  // Promote / Demote Role action
  const handleToggleUserRole = async (userId: number, currentRole: string) => {
    const nextRoleId = currentRole === "seller" ? 3 : 2; // Toggle between Seller (2) and User/Customer (3)
    await toggleUserRole(userId, nextRoleId);
    await loadData();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;
    await signupUser({
      name: newUserName,
      email: newUserEmail,
      passwordText: newUserPassword,
      roleId: newUserRole,
      phone: newUserPhone || undefined,
    });
    setNewUserName("");
    setNewUserEmail("");
    setNewUserPhone("");
    await loadData();
  };

  const handleCreateConversion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convFrom || !convTo || convFactor <= 0) return;
    await addUnitConversionRule({
      unitType: convCat,
      fromUnit: convFrom,
      toUnit: convTo,
      factor: convFactor,
    });
    setConvFrom("");
    setConvTo("");
    setConvFactor(1);
    await loadData();
  };

  const handleDeleteConversion = async (id: number) => {
    await deleteUnitConversionRule(id);
    await loadData();
  };

  // Chart Mocks
  const monthlySalesData = [
    { name: "Jan", Sales: 2200 },
    { name: "Feb", Sales: 3100 },
    { name: "Mar", Sales: 2800 },
    { name: "Apr", Sales: 4400 },
    { name: "May", Sales: revenueSum > 0 ? revenueSum * 0.45 : 3900 },
    { name: "Jun", Sales: revenueSum > 0 ? revenueSum : 5100 },
  ];

  const ordersTrendData = [
    { name: "Mon", Orders: 2 },
    { name: "Tue", Orders: 4 },
    { name: "Wed", Orders: totalOrdersCount > 0 ? totalOrdersCount : 5 },
    { name: "Thu", Orders: 3 },
    { name: "Fri", Orders: 7 },
    { name: "Sat", Orders: 1 },
  ];

  const categoriesStock = [
    { name: "Acids", value: products.filter((p) => p.categoryId === 1).reduce((acc, p) => acc + p.stockQuantity, 0) },
    { name: "Solvents", value: products.filter((p) => p.categoryId === 2).reduce((acc, p) => acc + p.stockQuantity, 0) },
    { name: "Lab Chem", value: products.filter((p) => p.categoryId === 3).reduce((acc, p) => acc + p.stockQuantity, 0) },
    { name: "Organic", value: products.filter((p) => p.categoryId === 4).reduce((acc, p) => acc + p.stockQuantity, 0) },
    { name: "Inorganic", value: products.filter((p) => p.categoryId === 5).reduce((acc, p) => acc + p.stockQuantity, 0) },
  ].filter(c => c.value > 0);

  const COLORS = ["#6D28D9", "#8B5CF6", "#A78BFA", "#C084FC", "#E9D5FF"];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex relative">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-[1600px] mx-auto w-full space-y-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl text-slate-900 dark:text-white">Admin Operations Console</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Operational summaries, conversion config, and session audits</p>
          </div>

          {/* METRIC GRID */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="p-4 bg-card scribble-card">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Products</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalProductsCount}</div>
              <p className="text-[10px] text-slate-400 mt-1">Chemical items</p>
            </div>
            <div className="p-4 bg-card scribble-card">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Stock</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalInventoryStock.toFixed(0)}</div>
              <p className="text-[10px] text-slate-400 mt-1">Aggregate units</p>
            </div>
            <div className="p-4 bg-card scribble-card">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Sellers</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalSellersCount}</div>
              <p className="text-[10px] text-slate-400 mt-1">Distributors</p>
            </div>
            <div className="p-4 bg-card scribble-card">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Users</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalUsersCount}</div>
              <p className="text-[10px] text-slate-400 mt-1">Authorized logins</p>
            </div>
            <div className="p-4 bg-card scribble-card">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Orders Count</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalOrdersCount}</div>
              <p className="text-[10px] text-slate-400 mt-1">In fulfillment</p>
            </div>
            <div className="p-4 scribble-card bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border-violet-500">
              <span className="text-[10px] uppercase font-bold text-violet-600 dark:text-violet-400 tracking-wider">Total Revenue</span>
              <div className="text-2xl font-black text-violet-600 dark:text-violet-400 mt-1">₹{revenueSum.toFixed(2)}</div>
              <p className="text-[10px] text-slate-400 mt-1">Order summaries</p>
            </div>
          </div>

          {/* VISUALIZATIONS SECTION */}
          {mounted && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="p-5 bg-card scribble-card">
                <div className="mb-4">
                  <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-violet-500" />
                    Monthly Sales Trend
                  </h3>
                </div>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlySalesData}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6D28D9" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6D28D9" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: "#0F172A", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px" }} />
                      <Area type="monotone" dataKey="Sales" stroke="#6D28D9" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-5 bg-card scribble-card">
                <div className="mb-4">
                  <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-500" />
                    Fulfillment Activity
                  </h3>
                </div>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ordersTrendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: "#0F172A", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px" }} />
                      <Bar dataKey="Orders" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-5 bg-card scribble-card">
                <div className="mb-4">
                  <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-violet-500" />
                    Inventory Allocation
                  </h3>
                </div>
                <div className="h-60 flex items-center justify-center">
                  {categoriesStock.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoriesStock}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {categoriesStock.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "#0F172A", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px" }} />
                        <Legend verticalAlign="bottom" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <span className="text-xs text-slate-400">No category allocation available</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* USERS ROLES CLEARANCE CENTER */}
            <div className="p-5 bg-card scribble-card flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
                  <Users className="w-5 h-5 text-violet-500" />
                  Access Clearance Center
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-900 dark:border-slate-800 text-slate-400 font-bold">
                        <th className="py-2.5">User Details</th>
                        <th className="py-2.5">Role</th>
                        <th className="py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-900/60">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                          <td className="py-3">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{u.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{u.email}</div>
                          </td>
                          <td className="py-3 capitalize">
                            <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${u.role === "admin"
                                ? "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400"
                                : u.role === "seller"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                              }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            {u.id !== activeUser.id ? (
                              u.role === "seller" ? (
                                <button
                                  onClick={() => handleToggleUserRole(u.id, "seller")}
                                  className="p-1 border scribble-border text-rose-500 text-[10px] px-2 py-1 inline-flex hover:bg-rose-500/10 transition-colors"
                                  title="Demote to Customer"
                                >
                                  Demote to Customer
                                </button>
                              ) : u.role === "customer" ? (
                                <button
                                  onClick={() => handleToggleUserRole(u.id, "customer")}
                                  className="p-1 border scribble-border text-emerald-500 text-[10px] px-2 py-1 inline-flex hover:bg-emerald-500/10 transition-colors"
                                  title="Promote to Seller"
                                >
                                  Promote to Seller
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">No swap</span>
                              )
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Self</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add User panel */}
              <form onSubmit={handleCreateUser} className="mt-6 border-t-2 border-dashed border-slate-900 dark:border-slate-800 pt-5 space-y-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Register User Profile</div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Full name"
                    className="scribble-input px-3 py-2 text-xs text-slate-900 dark:text-white"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                  />
                  <input
                    type="email"
                    required
                    placeholder="Email address"
                    className="scribble-input px-3 py-2 text-xs text-slate-900 dark:text-white"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    className="scribble-input px-3 py-2 text-xs text-slate-900 dark:text-white"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                  />
                  <select
                    className="scribble-input px-3 py-2 text-xs text-slate-900 dark:text-white"
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(parseInt(e.target.value))}
                  >
                    <option value={3}>User (Customer)</option>
                    <option value={2}>Seller</option>
                    <option value={1}>Admin</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 scribble-button cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-950" />
                  <span>Register User</span>
                </button>
              </form>
            </div>

            {/* CONVERSION ENGINE RULES CONFIG */}
            <div className="p-5 bg-card scribble-card flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
                  <Scale className="w-5 h-5 text-violet-500" />
                  Conversion Engine Calibration
                </h2>

                <div className="overflow-y-auto max-h-48 scrollbar-thin">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-900 dark:border-slate-800 text-slate-400 font-bold">
                        <th className="py-2.5">Conversion Path</th>
                        <th className="py-2.5">Category</th>
                        <th className="py-2.5">Multiplier Factor</th>
                        <th className="py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-900/60">
                      {unitConversions.map((conv) => (
                        <tr key={conv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                          <td className="py-3 font-semibold text-slate-750 dark:text-slate-300">
                            1 {conv.fromUnit} &rarr; {conv.toUnit}
                          </td>
                          <td className="py-3 capitalize text-slate-500 dark:text-slate-400 font-medium">
                            {conv.unitType}
                          </td>
                          <td className="py-3 font-mono text-slate-800 dark:text-slate-200">
                            {conv.factor}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleDeleteConversion(conv.id)}
                              className="p-1 text-rose-500 hover:bg-rose-500/10 rounded transition-colors inline-flex border border-transparent hover:border-rose-500"
                              title="Delete Rule"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add conversion rate formula */}
              <form onSubmit={handleCreateConversion} className="mt-6 border-t-2 border-dashed border-slate-900 dark:border-slate-800 pt-5 space-y-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Calibrate Conversion Rule</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <select
                    className="scribble-input px-3 py-2 text-xs text-slate-900 dark:text-white"
                    value={convCat}
                    onChange={(e) => setConvCat(e.target.value as any)}
                  >
                    <option value="weight">Weight</option>
                    <option value="volume">Volume</option>
                    <option value="count">Count</option>
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="From"
                    className="scribble-input px-3 py-2 text-xs text-slate-900 dark:text-white"
                    value={convFrom}
                    onChange={(e) => setConvFrom(e.target.value)}
                  />
                  <input
                    type="text"
                    required
                    placeholder="To"
                    className="scribble-input px-3 py-2 text-xs text-slate-900 dark:text-white"
                    value={convTo}
                    onChange={(e) => setConvTo(e.target.value)}
                  />
                  <input
                    type="number"
                    required
                    min="0.000001"
                    step="any"
                    placeholder="Factor"
                    className="scribble-input px-3 py-2 text-xs text-slate-900 dark:text-white"
                    value={convFactor}
                    onChange={(e) => setConvFactor(parseFloat(e.target.value) || 1)}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 scribble-button cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-950" />
                  <span>Configure Rule</span>
                </button>
              </form>
            </div>
          </div>

          {/* AUDIT TRAILS / LOG HISTORY */}
          <div className="p-5 bg-card scribble-card">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-violet-500" />
              Administrative Security Audit Trail
            </h2>
            <div className="max-h-64 overflow-y-auto space-y-3 p-1 scrollbar-thin">
              {activityLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg bg-slate-50/50 dark:bg-slate-900/30 border border-slate-300 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-scribble"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-violet-500" />
                    <div>
                      <div className="font-semibold text-slate-850 dark:text-slate-200">
                        {log.action} &bull; <span className="font-normal text-slate-450 capitalize">{log.userRole}</span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">{log.details}</p>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 sm:text-right shrink-0">
                    <div>{log.userId}</div>
                    <div className="mt-1">{new Date(log.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

