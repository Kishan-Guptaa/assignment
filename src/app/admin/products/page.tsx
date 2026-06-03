"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Search,
  SlidersHorizontal,
  History,
  X,
  FileSpreadsheet,
  CheckCircle,
  FlaskConical,
  Scale
} from "lucide-react";
import { getCurrentUser } from "@/lib/actions/auth";
import {
  getProductsList,
  getCategoriesList,
  createProduct,
  editProduct,
  deleteProduct,
  adjustProductStock,
  getDBConversionFactor,
  getActivityLogsList
} from "@/lib/actions/inventoryActions";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { exportToCSV } from "@/lib/utils/export";

export default function ProductManagement() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  // Database states
  const [activeUser, setActiveUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<any[]>([]);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [filterLowStock, setFilterLowStock] = useState(false);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Add/Edit Product Form State
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState(1);
  const [description, setDescription] = useState("");
  const [baseUnit, setBaseUnit] = useState<"g" | "kg" | "mL" | "L" | "unit">("kg");
  const [basePrice, setBasePrice] = useState<number>(0);
  const [initialStock, setInitialStock] = useState<number>(0);
  const [minimumStock, setMinimumStock] = useState<number>(10);
  const [imageUrl, setImageUrl] = useState("");

  // Stock Adjustment Form State
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustUnit, setAdjustUnit] = useState<string>("kg");
  const [adjustType, setAdjustType] = useState<"IN" | "OUT" | "ADJUSTMENT">("IN");
  const [adjustNote, setAdjustNote] = useState("");
  const [previewFactor, setPreviewFactor] = useState<number>(1);

  // Load database lists
  async function loadData() {
    try {
      const user = await getCurrentUser();
      setActiveUser(user);
      if (user && user.role !== "customer") {
        const pList = await getProductsList();
        setProducts(pList);
        const cList = await getCategoriesList();
        setCategories(cList);
        const logs = await getActivityLogsList();
        setInventoryLogs(logs.filter((log) => log.action.includes("INVENTORY")));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Sync conversion previews factor dynamically
  useEffect(() => {
    async function updatePreview() {
      if (selectedProduct) {
        const mult = await getDBConversionFactor(adjustUnit, selectedProduct.baseUnit);
        setPreviewFactor(mult);
      }
    }
    updatePreview();
  }, [adjustUnit, selectedProduct]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-scribble text-white">
        <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  if (!activeUser || activeUser.role === "customer") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-scribble">
        <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col items-center scribble-card">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-6">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-white">Clearance Guard Alert</h1>
          <p className="mt-3 text-slate-400 text-xs">
            Customers cannot modify inventory balances directly. Swap roles to proceed.
          </p>
          <button
            onClick={() => router.push("/customer")}
            className="mt-6 w-full py-2 bg-violet-600 hover:bg-violet-700 text-slate-950 font-black rounded-lg scribble-button"
          >
            Back to Customer Store
          </button>
        </div>
      </div>
    );
  }

  const filteredProducts = products.filter((p) => {
    // Sellers only manage their own listings
    if (activeUser.role === "seller" && p.sellerId !== activeUser.id) return false;

    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.categoryId.toString() === selectedCategory;
    const matchesLowStock = !filterLowStock || p.stockQuantity < p.minimumStock;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProduct({
      name,
      sku,
      categoryId,
      description,
      baseUnit,
      basePrice,
      initialStock,
      minimumStock,
      imageUrl: imageUrl || undefined,
    });
    setIsAddOpen(false);
    // Reset forms
    setName("");
    setSku("");
    setDescription("");
    setBasePrice(0);
    setInitialStock(0);
    setImageUrl("");
    await loadData();
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    await editProduct(selectedProduct.id, {
      name,
      sku,
      categoryId,
      description,
      basePrice,
      imageUrl: imageUrl || undefined,
    });
    setIsEditOpen(false);
    await loadData();
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const factorMultiplier = adjustType === "OUT" ? -1 : 1;
    const qtyChange = adjustQty * factorMultiplier;

    await adjustProductStock(
      selectedProduct.id,
      qtyChange,
      adjustUnit,
      adjustType,
      adjustNote || "Manual Warehouse Restock"
    );
    setIsStockOpen(false);
    setAdjustQty(0);
    setAdjustNote("");
    await loadData();
  };

  const handleDelete = async (id: number) => {
    await deleteProduct(id);
    await loadData();
  };

  const openEditModal = (p: any) => {
    setSelectedProduct(p);
    setName(p.name);
    setSku(p.sku);
    setCategoryId(p.categoryId);
    setDescription(p.description || "");
    setBaseUnit(p.baseUnit);
    setBasePrice(p.basePrice);
    setImageUrl(p.imageUrl || "");
    setIsEditOpen(true);
  };

  const openStockModal = (p: any) => {
    setSelectedProduct(p);
    setAdjustUnit(p.baseUnit);
    setAdjustType("IN");
    setAdjustQty(0);
    setIsStockOpen(true);
  };

  const handleExport = () => {
    const csvData = filteredProducts.map((p) => ({
      SKU: p.sku,
      Name: p.name,
      Category: p.categoryName,
      "Stock Level": p.stockQuantity.toFixed(2),
      "Base Unit": p.baseUnit,
      "Base Rate": `₹${p.basePrice.toFixed(2)}`,
      Status: p.status,
    }));
    exportToCSV(csvData, "AasaMedChem_Inventory_Report");
  };

  const previewBaseChange = adjustQty * previewFactor;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex relative">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-[1600px] mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Product Inventory Manager</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage chemical products catalog and stock logistics</p>
            </div>

            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-2 px-4 py-2 border scribble-border bg-card text-xs font-semibold cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                <span>Export Excel</span>
              </button>
              <button
                onClick={() => {
                  setName("");
                  setSku("");
                  setDescription("");
                  setBasePrice(0);
                  setInitialStock(0);
                  setIsAddOpen(true);
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-slate-950 rounded-xl text-xs font-black scribble-button cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Chemical</span>
              </button>
            </div>
          </div>

          {/* FILTERS PANEL */}
          <div className="p-4 bg-card scribble-card flex flex-col md:flex-row gap-4 items-center justify-between font-scribble">
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search name or SKU..."
                className="w-full scribble-input pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              <div className="flex items-center gap-2 text-xs">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400">Category:</span>
                <select
                  className="scribble-input px-2.5 py-1 focus:outline-none"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setFilterLowStock(!filterLowStock)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer scribble-button ${filterLowStock
                    ? "bg-rose-500/10 border-rose-500 text-rose-500"
                    : "text-slate-500 dark:text-slate-400"
                  }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Low Stock Warnings</span>
              </button>
            </div>
          </div>

          {/* INVENTORY DATABASE TABLE */}
          <div className="bg-card scribble-card font-scribble overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-900 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-405 font-bold uppercase tracking-wider">
                    <th className="p-4">Chemical Product</th>
                    <th className="p-4">SKU Code</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Base Rate</th>
                    <th className="p-4">Available Stock</th>
                    <th className="p-4">Reserved</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 dark:divide-slate-800">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((p) => {
                      const isLow = p.stockQuantity < p.minimumStock;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img src={p.imageUrl || "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=200"} className="w-10 h-10 rounded-lg object-cover scribble-border" alt={p.name} />
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm block">
                                  {p.name}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-mono font-medium text-slate-500 dark:text-slate-400">{p.sku}</td>
                          <td className="p-4 text-slate-650">{p.categoryName}</td>
                          <td className="p-4 font-mono font-semibold">₹{p.basePrice.toFixed(2)} / {p.baseUnit}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${isLow ? "text-rose-500 font-black" : "text-slate-900 dark:text-white"}`}>
                                {p.stockQuantity.toFixed(2)} {p.baseUnit}
                              </span>
                              {isLow && <span className="text-rose-500 font-bold">(Low)</span>}
                            </div>
                          </td>
                          <td className="p-4 font-mono text-slate-500">{p.reservedQuantity.toFixed(2)} {p.baseUnit}</td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openStockModal(p)}
                                className="px-2 py-1.5 border scribble-border hover:bg-violet-600 hover:text-white font-semibold text-[10px] transition-colors"
                              >
                                Restock
                              </button>
                              <button
                                onClick={() => openEditModal(p)}
                                className="p-1.5 border scribble-border hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(p.id)}
                                className="p-1.5 border scribble-border hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center p-12 text-slate-400">
                        No chemical products found in database matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOVEMENT LOGS */}
          <div className="p-5 bg-card scribble-card">
            <h2 className="text-md font-bold text-slate-850 dark:text-white flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-violet-500" />
              Inventory Transaction History Logs
            </h2>
            <div className="max-h-60 overflow-y-auto space-y-2 scrollbar-thin">
              {inventoryLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg bg-slate-50/50 dark:bg-slate-900/30 border border-slate-300 dark:border-slate-800 flex items-center justify-between text-xs font-scribble"
                >
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{log.action}</span>
                    <p className="text-[10px] text-slate-400 mt-1">{log.details}</p>
                  </div>
                  <div className="text-[10px] text-slate-400 text-right">
                    <div>{log.userId}</div>
                    <div className="mt-1">{new Date(log.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* CREATE MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-card border-2 border-slate-900 dark:border-slate-200 rounded-2xl p-6 shadow-2xl scribble-card font-scribble">
            <div className="flex justify-between items-center border-b-2 border-dashed border-slate-900 dark:border-slate-800 pb-4 mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-violet-500" />
                Register Chemical Product
              </h2>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Chemical Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Hydrochloric Acid"
                    className="w-full scribble-input px-3 py-2 text-slate-900 dark:text-white"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">SKU Code</label>
                  <input
                    type="text"
                    required
                    placeholder="HCL-001"
                    className="w-full scribble-input px-3 py-2 text-slate-900 dark:text-white"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Category</label>
                  <select
                    className="w-full scribble-input px-2.5 py-2 text-slate-900 dark:text-white"
                    value={categoryId}
                    onChange={(e) => setCategoryId(parseInt(e.target.value))}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Base Unit</label>
                  <select
                    className="w-full scribble-input px-2.5 py-2 text-slate-900 dark:text-white"
                    value={baseUnit}
                    onChange={(e) => setBaseUnit(e.target.value as any)}
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="mL">mL</option>
                    <option value="L">L</option>
                    <option value="unit">unit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Base Price ($)</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="any"
                    placeholder="Price rate"
                    className="w-full scribble-input px-3 py-2 text-slate-900 dark:text-white"
                    value={basePrice}
                    onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Initial Stock</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Warehouse volume"
                    className="w-full scribble-input px-3 py-2 text-slate-900 dark:text-white"
                    value={initialStock}
                    onChange={(e) => setInitialStock(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Min Stock Alert</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Low stock alert trigger"
                    className="w-full scribble-input px-3 py-2 text-slate-900 dark:text-white"
                    value={minimumStock}
                    onChange={(e) => setMinimumStock(parseFloat(e.target.value) || 10)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Image URL</label>
                  <input
                    type="text"
                    placeholder="URL (optional)"
                    className="w-full scribble-input px-3 py-2 text-slate-900 dark:text-white"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Product Description</label>
                <textarea
                  placeholder="Composition details..."
                  className="w-full scribble-input px-3 py-2 text-slate-900 dark:text-white h-16"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-slate-950 rounded-lg font-black text-xs scribble-button cursor-pointer"
              >
                Publish Chemical Product
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-card border-2 border-slate-900 dark:border-slate-200 rounded-2xl p-6 shadow-2xl scribble-card font-scribble">
            <div className="flex justify-between items-center border-b-2 border-dashed border-slate-900 dark:border-slate-800 pb-4 mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-violet-500" />
                Edit Chemical Product
              </h2>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Chemical Name</label>
                  <input
                    type="text"
                    required
                    className="w-full scribble-input px-3 py-2 text-slate-900 dark:text-white"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">SKU Code</label>
                  <input
                    type="text"
                    required
                    className="w-full scribble-input px-3 py-2 text-slate-900 dark:text-white"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Category</label>
                  <select
                    className="w-full scribble-input px-2.5 py-2 text-slate-900 dark:text-white"
                    value={categoryId}
                    onChange={(e) => setCategoryId(parseInt(e.target.value))}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Base Price ($)</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="any"
                    className="w-full scribble-input px-3 py-2 text-slate-900 dark:text-white"
                    value={basePrice}
                    onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Image URL</label>
                <input
                  type="text"
                  className="w-full scribble-input px-3 py-2 text-slate-900 dark:text-white"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Product Description</label>
                <textarea
                  className="w-full scribble-input px-3 py-2 text-slate-900 dark:text-white h-16"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-slate-950 rounded-lg font-black text-xs scribble-button cursor-pointer"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADJUST STOCK RESTOCK MODAL */}
      {isStockOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card border-2 border-slate-900 dark:border-slate-200 rounded-2xl p-6 shadow-2xl scribble-card font-scribble">
            <div className="flex justify-between items-center border-b-2 border-dashed border-slate-900 dark:border-slate-800 pb-4 mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-violet-500" />
                Inventory Stock Intake
              </h2>
              <button onClick={() => setIsStockOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20 text-xs">
              <div className="font-semibold text-slate-800 dark:text-slate-200">{selectedProduct.name}</div>
              <div className="text-[10px] text-slate-400 mt-1">
                Current warehouse stock: <span className="font-bold">{selectedProduct.stockQuantity.toFixed(2)} {selectedProduct.baseUnit}</span>
              </div>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Adjustment Quantity</label>
                  <input
                    type="number"
                    required
                    min="0.0001"
                    step="any"
                    placeholder="Amount"
                    className="w-full scribble-input px-3 py-2 text-slate-900 dark:text-white"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Unit</label>
                  <select
                    className="w-full scribble-input px-2 py-2 text-slate-900 dark:text-white"
                    value={adjustUnit}
                    onChange={(e) => setAdjustUnit(e.target.value)}
                  >
                    {["kg", "g"].includes(selectedProduct.baseUnit) && (
                      <>
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                      </>
                    )}
                    {["L", "mL"].includes(selectedProduct.baseUnit) && (
                      <>
                        <option value="L">L</option>
                        <option value="mL">mL</option>
                      </>
                    )}
                    {selectedProduct.baseUnit === "unit" && <option value="unit">unit</option>}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Action</label>
                  <select
                    className="w-full scribble-input px-2.5 py-2 text-slate-900 dark:text-white"
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value as any)}
                  >
                    <option value="IN">Intake (+) Add</option>
                    <option value="OUT">Removal (-) Deduct</option>
                    <option value="ADJUSTMENT">Re-Calibration (Audit)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Internal Note</label>
                  <input
                    type="text"
                    placeholder="Batch references"
                    className="w-full scribble-input px-3 py-2 text-slate-900 dark:text-white"
                    value={adjustNote}
                    onChange={(e) => setAdjustNote(e.target.value)}
                  />
                </div>
              </div>

              {/* LIVE CONVERSION CONTEXT */}
              {adjustUnit !== selectedProduct.baseUnit && adjustQty > 0 && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-600 dark:text-emerald-400">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <Scale className="w-3.5 h-3.5" />
                    <span>Live Unit Conversion Preview</span>
                  </div>
                  <div>
                    Equivalent to: <span className="font-bold underline decoration-dotted">{previewBaseChange.toFixed(3)} {selectedProduct.baseUnit}</span> base units increase/decrease.
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-slate-950 rounded-lg font-black text-xs scribble-button cursor-pointer"
              >
                Log Transaction &amp; Adjust
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

