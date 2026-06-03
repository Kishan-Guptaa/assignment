"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShoppingBag,
  ShoppingCart,
  History,
  Search,
  Scale,
  Plus,
  Trash2,
  CheckCircle,
  HelpCircle,
  FileCheck,
  Package,
  Truck,
  Clock,
  Printer,
  ChevronRight,
  Sparkles,
  Layers,
  Heart,
  ShieldAlert
} from "lucide-react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { getCurrentUser } from "@/lib/actions/auth";
import { getProductsList, getCategoriesList, getUnitConversionsList } from "@/lib/actions/inventoryActions";
import { getOrdersList, submitQuotationRequestAction, placeDirectOrderAction } from "@/lib/actions/quotationActions";
import { printInvoice } from "@/lib/utils/export";
import confetti from "canvas-confetti";

interface CartItem {
  productId: number;
  quantity: number;
  unit: string;
}

function CustomerDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamQuery = searchParams.get("search") || "";

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"store" | "cart" | "orders">("store");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Database-backed states
  const [activeUser, setActiveUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [unitConversions, setUnitConversions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  // Client-side cart state
  const [cart, setCart] = useState<CartItem[]>([]);

  // Search/Filter state
  const [search, setSearch] = useState(searchParamQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Product configurations state inside cards (unit/qty selectors)
  const [cardConfigs, setCardConfigs] = useState<Record<number, { unit: any; qty: number }>>({});

  // Sync search URL param
  useEffect(() => {
    if (searchParamQuery) {
      setSearch(searchParamQuery);
      setActiveTab("store");
    }
  }, [searchParamQuery]);

  // Load database lists
  async function loadData() {
    try {
      const user = await getCurrentUser();
      setActiveUser(user);
      if (user) {
        const pList = await getProductsList();
        setProducts(pList);
        const cList = await getCategoriesList();
        setCategories(cList);
        const uConvs = await getUnitConversionsList();
        setUnitConversions(uConvs);
        const oList = await getOrdersList();
        setOrders(oList);
      }
    } catch (e) {
      console.error("Error loading customer storefront data:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // Load cart from localStorage
    const cached = localStorage.getItem("aasamedchem_cart");
    if (cached) {
      try {
        setCart(JSON.parse(cached));
      } catch { }
    }
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem("aasamedchem_cart", JSON.stringify(newCart));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-scribble text-white">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-xs text-slate-400">Loading catalog storefront...</p>
        </div>
      </div>
    );
  }

  if (!activeUser) {
    router.push("/login");
    return null;
  }

  // Choose conversion factors dynamically
  const getConversionFactor = (fromUnit: string, toUnit: string) => {
    if (fromUnit.toLowerCase() === toUnit.toLowerCase()) return 1;
    const conv = unitConversions.find(
      (c) => c.fromUnit.toLowerCase() === fromUnit.toLowerCase() && c.toUnit.toLowerCase() === toUnit.toLowerCase()
    );
    if (conv) return conv.factor;
    const reverseConv = unitConversions.find(
      (c) => c.fromUnit.toLowerCase() === toUnit.toLowerCase() && c.toUnit.toLowerCase() === fromUnit.toLowerCase()
    );
    if (reverseConv) return 1 / reverseConv.factor;
    return 1;
  };

  // Set default configurations for products
  const getCardConfig = (prodId: number, baseUnit: any) => {
    if (cardConfigs[prodId]) return cardConfigs[prodId];
    return { unit: baseUnit, qty: 1 };
  };

  const updateCardConfig = (prodId: number, field: "unit" | "qty", val: any) => {
    setCardConfigs((prev) => {
      const config = prev[prodId] || { unit: products.find((p) => p.id === prodId)!.baseUnit, qty: 1 };
      return {
        ...prev,
        [prodId]: {
          ...config,
          [field]: val,
        },
      };
    });
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    if (p.status !== "active") return false;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.categoryId.toString() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Compile cart calculations
  const cartItems = cart.map((item) => {
    const product = products.find((p) => p.id === item.productId)!;
    const factor = getConversionFactor(item.unit, product.baseUnit); // e.g. converting g to kg is 0.001
    const unitPrice = product.basePrice / factor; // Price per user-selected unit
    const totalAmount = unitPrice * item.quantity;
    const baseQuantityConverted = item.quantity * factor;

    return {
      ...item,
      product,
      unitPrice,
      totalAmount,
      factor,
      baseQuantityConverted,
    };
  });

  const cartSubtotal = cartItems.reduce((acc, item) => acc + item.totalAmount, 0);

  // Cart operations
  const addToCart = (productId: number, quantity: number, unit: string) => {
    const existingIndex = cart.findIndex((item) => item.productId === productId);
    let newCart = [...cart];
    if (existingIndex > -1) {
      newCart[existingIndex] = { productId, quantity, unit };
    } else {
      newCart.push({ productId, quantity, unit });
    }
    saveCart(newCart);
  };

  const removeFromCart = (productId: number) => {
    const newCart = cart.filter((item) => item.productId !== productId);
    saveCart(newCart);
  };

  const updateCartQuantity = (productId: number, quantity: number, unit: string) => {
    const newCart = cart.map((item) => (item.productId === productId ? { ...item, quantity, unit } : item));
    saveCart(newCart);
  };

  const clearCart = () => {
    saveCart([]);
  };

  // Submit quote request
  const handleRequestQuote = async () => {
    setSubmitting(true);
    const result = await submitQuotationRequestAction(
      cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unit: item.unit,
      }))
    );
    setSubmitting(false);
    if (result.success) {
      saveCart([]);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#6D28D9", "#8B5CF6", "#A78BFA"],
      });
      await loadData();
      setActiveTab("orders");
    } else {
      alert(result.message || "Failed to submit quote request.");
    }
  };

  // Place Direct Order
  const handlePlaceOrder = async () => {
    setSubmitting(true);
    const result = await placeDirectOrderAction(
      cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unit: item.unit,
      }))
    );
    setSubmitting(false);
    if (result.success) {
      saveCart([]);
      confetti({
        particleCount: 130,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#10B981", "#6D28D9", "#A78BFA"],
      });
      await loadData();
      setActiveTab("orders");
    } else {
      alert(result.message || "Failed to place direct order. Stock levels may be too low.");
    }
  };

  // Print invoice helper
  const handlePrint = (order: any) => {
    const customerName = activeUser.name;
    const itemsDetails = order.items.map((item: any) => {
      const prod = products.find((p) => p.id === item.productId)!;
      return {
        name: prod ? prod.name : "Unknown Chemical",
        sku: prod ? prod.sku : "N/A",
        qty: item.quantity,
        unit: item.unit,
        price: item.rate,
        total: item.subtotal,
      };
    });
    printInvoice(order, customerName, itemsDetails);
  };

  // Fallback image generator
  const getProductImage = (p: any) => {
    if (p.imageUrl) return p.imageUrl;
    // Fallbacks
    if (p.name.toLowerCase().includes("ethanol")) return "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=200&auto=format&fit=crop&q=60";
    if (p.name.toLowerCase().includes("sodium")) return "https://images.unsplash.com/photo-1532187863486-abf9d39d66e8?w=200&auto=format&fit=crop&q=60";
    return "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=200&auto=format&fit=crop&q=60";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-scribble">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex relative">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-[1600px] mx-auto w-full space-y-6">
          {/* Dashboard Title & Tabs Navigation */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Customer Storefront Portal</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Browse laboratory grade chemicals and compile quote carts</p>
            </div>

            {/* TAB CONTROLLERS */}
            <div className="flex bg-slate-200/60 dark:bg-slate-900/60 p-1 rounded-xl w-full sm:w-auto">
              <button
                onClick={() => setActiveTab("store")}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${activeTab === "store"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Store</span>
              </button>
              <button
                onClick={() => setActiveTab("cart")}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer relative ${activeTab === "cart"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Quote Cart</span>
                {cart.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-violet-600 text-white font-bold text-[9px] flex items-center justify-center absolute -top-1 -right-1 ring-2 ring-white dark:ring-slate-955 animate-bounce">
                    {cart.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${activeTab === "orders"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>My Orders</span>
              </button>
            </div>
          </div>

          {/* TAB 1: CHEMICAL STOREFRONT */}
          {activeTab === "store" && (
            <div className="space-y-6">
              {/* Filter controls */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-905/60 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search compound name or SKU..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2 text-xs w-full sm:w-auto justify-end">
                  <span className="text-slate-400">Category:</span>
                  <select
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Products Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((p) => {
                    const config = getCardConfig(p.id, p.baseUnit);

                    // Live price matching calculation
                    const factor = getConversionFactor(config.unit, p.baseUnit); // e.g. g to kg is 0.001
                    const liveUnitPrice = p.basePrice / factor; // E.g. $10 kg / 0.001 is $0.01 per gram rate
                    const liveTotalPrice = liveUnitPrice * config.qty;

                    return (
                      <div
                        key={p.id}
                        className="rounded-2xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm flex flex-col justify-between hover:border-violet-500/40 transition-colors"
                      >
                        <div className="p-5 space-y-4">
                          {/* Image & details */}
                          <div className="flex gap-4">
                            <img src={getProductImage(p)} className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-800" alt={p.name} />
                            <div>
                              <h3 className="font-bold text-slate-850 dark:text-white text-sm">{p.name}</h3>
                              <span className="text-[10px] text-slate-400 block mt-1">SKU: {p.sku}</span>
                              <span className="text-[10px] bg-slate-105 dark:bg-slate-800 border dark:border-slate-700 px-1.5 py-0.5 rounded text-slate-500 inline-block mt-1.5 font-mono">
                                Available Stock: {p.stockQuantity.toFixed(2)} {p.baseUnit}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-500 leading-normal line-clamp-2 h-8">{p.description}</p>

                          {/* Unit price calculators */}
                          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border dark:border-slate-800 space-y-3">
                            <div className="flex justify-between items-center text-[10px] text-slate-400">
                              <span>Choose Packaging:</span>
                              <select
                                className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded px-1.5 py-0.8 font-semibold text-[10px]"
                                value={config.unit}
                                onChange={(e) => updateCardConfig(p.id, "unit", e.target.value)}
                              >
                                {["kg", "g"].includes(p.baseUnit) && (
                                  <>
                                    <option value="kg">kg (Kilogram)</option>
                                    <option value="g">g (Gram)</option>
                                  </>
                                )}
                                {["L", "mL"].includes(p.baseUnit) && (
                                  <>
                                    <option value="L">L (Liter)</option>
                                    <option value="mL">mL (Milliliter)</option>
                                  </>
                                )}
                                {p.baseUnit === "unit" && <option value="unit">unit (Count)</option>}
                              </select>
                            </div>

                            <div className="flex justify-between items-center text-[10px] text-slate-400">
                              <span>Unit Rate:</span>
                              <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                                ₹{liveUnitPrice.toFixed(3)} / {config.unit}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t dark:border-slate-800">
                              <div>
                                <label className="block text-[9px] text-slate-400 mb-1">Quantity</label>
                                <input
                                  type="number"
                                  min="1"
                                  className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded px-2 py-1 font-semibold text-xs"
                                  value={config.qty}
                                  onChange={(e) => updateCardConfig(p.id, "qty", Math.max(1, parseInt(e.target.value) || 1))}
                                />
                              </div>
                              <div className="text-right">
                                <span className="block text-[9px] text-slate-400 mb-1">Live Estimate</span>
                                <span className="font-mono font-extrabold text-slate-800 dark:text-slate-100 text-xs">
                                  ₹{liveTotalPrice.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card CTA Actions */}
                        <div className="p-4 border-t dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/40 flex gap-2">
                          <button
                            onClick={() => {
                              addToCart(p.id, config.qty, config.unit);
                              confetti({
                                particleCount: 15,
                                angle: 60,
                                spread: 55,
                                origin: { x: 0 },
                                colors: ["#6D28D9", "#8B5CF6"],
                              });
                            }}
                            className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-slate-950 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-violet-500/10 scribble-button"
                          >
                            <ShoppingCart className="w-3.5 h-3.5 text-slate-950" />
                            <span>Add to Quote Cart</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full text-center py-20 text-slate-400">
                    No active chemicals found in the catalog.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: QUOTATION CART VIEW */}
          {activeTab === "cart" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* CART LIST (Left 2 columns) */}
              <div className="lg:col-span-2 p-5 bg-card scribble-card space-y-4">
                <h2 className="text-md font-bold text-slate-850 dark:text-white flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-violet-500" />
                  Your Quote Cart
                </h2>

                {cartItems.length > 0 ? (
                  <div className="divide-y divide-slate-150 dark:divide-slate-850">
                    {cartItems.map((item) => (
                      <div key={item.productId} className="py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div className="flex gap-4">
                          <img src={getProductImage(item.product)} className="w-12 h-12 rounded-lg object-cover border dark:border-slate-800" alt={item.product.name} />
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block text-sm">{item.product.name}</span>
                            <span className="text-[10px] text-slate-450 mt-1 block">SKU: {item.product.sku}</span>

                            {/* STEP-BY-STEP CONVERSION EXPLANATION */}
                            <div className="text-[9px] text-violet-550 bg-violet-500/5 border border-violet-500/10 px-2 py-1 rounded mt-2 max-w-md flex items-center gap-1.5">
                              <Scale className="w-3 h-3 flex-shrink-0" />
                              <span>
                                Formula: {item.quantity} {item.unit} &rarr; {item.baseQuantityConverted.toFixed(3)} {item.product.baseUnit} base unit. Total: {item.baseQuantityConverted.toFixed(3)} &times; ₹{item.product.basePrice.toFixed(2)} = ₹{item.totalAmount.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6">
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              min="1"
                              className="w-16 bg-slate-50 dark:bg-slate-950 border dark:border-slate-850 rounded-lg px-2.5 py-1 text-center font-bold text-xs"
                              value={item.quantity}
                              onChange={(e) => updateCartQuantity(item.productId, Math.max(1, parseInt(e.target.value) || 1), item.unit)}
                            />
                            <span className="text-xs text-slate-400 capitalize">{item.unit}</span>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="block font-mono font-bold text-slate-800 dark:text-slate-250 text-sm">₹{item.totalAmount.toFixed(2)}</span>
                            <button
                              onClick={() => removeFromCart(item.productId)}
                              className="text-[10px] text-rose-500 hover:underline mt-1 block"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="pt-4 flex justify-between items-center">
                      <button
                        onClick={clearCart}
                        className="text-xs text-slate-400 hover:text-slate-655"
                      >
                        Clear Cart
                      </button>
                      <div className="text-right">
                        <span className="text-xs text-slate-400">Total Price Estimate:</span>
                        <span className="block font-mono font-extrabold text-violet-600 dark:text-violet-400 text-lg mt-0.5">₹{cartSubtotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-400 text-xs">
                    Your quote cart is currently empty. Browse chemicals and add compounds to get estimates.
                  </div>
                )}
              </div>

              {/* CHECKOUT & REQUEST QUOTE FORM (Right 1 column) */}
              {cartItems.length > 0 && (
                <div className="p-5 bg-card scribble-card space-y-4">
                  <h3 className="font-bold text-slate-850 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-violet-500" />
                    Clearing Center
                  </h3>

                  <div className="text-xs text-slate-500 leading-normal space-y-2 border-b dark:border-slate-800 pb-4">
                    <p>Review the options below to proceed with procurement:</p>
                    <div className="flex gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 text-[10px]">
                      <HelpCircle className="w-3.5 h-3.5 flex-shrink-0 text-slate-400 mt-0.5" />
                      <span>
                        <strong>Request Quote:</strong> Submits to Admins for review. Recommended for custom rates or bulk requests.
                        <br />
                        <strong>Place Direct Order:</strong> Instantly deducts warehouse stock and schedules packaging.
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={handleRequestQuote}
                      disabled={submitting}
                      className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-slate-950 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-violet-500/15 scribble-button disabled:opacity-60 transition-all"
                    >
                      <FileCheck className="w-4 h-4 text-slate-950" />
                      <span>{submitting ? "Submitting..." : "Submit Quotation Request"}</span>
                    </button>
                    <button
                      onClick={handlePlaceOrder}
                      disabled={submitting}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-slate-950 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/15 scribble-button disabled:opacity-60 transition-all"
                    >
                      <ShoppingBag className="w-4 h-4 text-slate-950" />
                      <span>{submitting ? "Processing..." : "Place Direct Order (Instant Checkout)"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ORDER HISTORY & TRACKER */}
          {activeTab === "orders" && (
            <div className="p-5 bg-card scribble-card space-y-6">
              <h2 className="text-md font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-violet-500" />
                Your Purchase Orders History
              </h2>

              <div className="space-y-4">
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 rounded-xl border dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs"
                    >
                      {/* Order info */}
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 dark:text-white font-mono">{order.orderNumber}</div>
                        <div className="text-[10px] text-slate-400">
                          Date Placed: {new Date(order.createdAt).toLocaleDateString()} &bull; Items count: {order.items.length}
                        </div>
                        <div className="font-mono font-bold text-violet-600 dark:text-violet-400 mt-1">Total: ₹{order.totalAmount.toFixed(2)}</div>
                      </div>

                      {/* Timeline Status */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] capitalize ${order.status === "Cancelled"
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                            : order.status === "Delivered"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400"
                          }`}>
                          Status: {order.status}
                        </span>

                        <button
                          onClick={() => handlePrint(order)}
                          className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-[10px] flex items-center gap-1 cursor-pointer scribble-button"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-550" />
                          <span>Download Invoice PDF</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    You have not placed any orders yet. Add items to quote cart to checkout.
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function CustomerDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-scribble text-white">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-xs text-slate-400">Loading catalog storefront...</p>
        </div>
      </div>
    }>
      <CustomerDashboardContent />
    </Suspense>
  );
}

