"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Calendar,
  CheckCircle,
  Truck,
  Package,
  Printer,
  ChevronRight,
  XCircle,
  Clock,
  AlertTriangle
} from "lucide-react";
import { getCurrentUser, getUsersList } from "@/lib/actions/auth";
import { getOrdersList, updateOrderStatusAction } from "@/lib/actions/quotationActions";
import { getProductsList } from "@/lib/actions/inventoryActions";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { printInvoice } from "@/lib/utils/export";

export default function OrdersManagement() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Database-backed states
  const [activeUser, setActiveUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Load database lists
  async function loadData() {
    try {
      const user = await getCurrentUser();
      setActiveUser(user);
      if (user && user.role !== "customer") {
        const oList = await getOrdersList();
        setOrders(oList);
        const pList = await getProductsList();
        setProducts(pList);
        const uList = await getUsersList();
        setUsers(uList);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-scribble text-white">
        <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  if (!activeUser || activeUser.role === "customer") {
    router.push("/customer");
    return null;
  }

  const handlePrint = (order: any) => {
    const customerName = order.customerName;

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

  const handleAdvanceStatus = async (orderId: number, currentStatus: string) => {
    let nextStatus: any = "Pending";
    if (currentStatus === "Pending") nextStatus = "Processing";
    else if (currentStatus === "Processing") nextStatus = "Shipped";
    else if (currentStatus === "Shipped") nextStatus = "Delivered";

    setSubmitting(true);
    await updateOrderStatusAction(orderId, nextStatus);
    await loadData();
    // Refresh selected order state
    const oList = await getOrdersList();
    const updatedOrder = oList.find((o) => o.id === orderId);
    setSelectedOrder(updatedOrder || null);
    setSubmitting(false);
  };

  const handleCancelOrder = async (orderId: number) => {
    setSubmitting(true);
    await updateOrderStatusAction(orderId, "Cancelled" as any);
    await loadData();
    const oList = await getOrdersList();
    const updatedOrder = oList.find((o) => o.id === orderId);
    setSelectedOrder(updatedOrder || null);
    setSubmitting(false);
  };

  const stages: Array<{ key: string; label: string; desc: string; icon: any }> = [
    { key: "Pending", label: "Pending Validation", desc: "Awaiting administrative matching", icon: Clock },
    { key: "Processing", label: "Processing & Batching", desc: "Chemical batch extraction and containment packing", icon: Package },
    { key: "Shipped", label: "Shipped", desc: "Transferred to hazardous shipping carrier", icon: Truck },
    { key: "Delivered", label: "Delivered", desc: "Arrived at laboratory receiving dock", icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex relative">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-[1600px] mx-auto w-full space-y-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Orders Fulfillment Pipeline</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track dispatch logistics, inspect timelines, and generate PDF invoices</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* ORDERS LIST */}
            <div className="lg:col-span-2 p-5 bg-card scribble-card font-scribble">
              <h2 className="text-md font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                <ClipboardList className="w-5 h-5 text-violet-500" />
                Active Pipelines
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-900 dark:border-slate-800 text-slate-405 font-bold uppercase">
                      <th className="py-3">Order ID</th>
                      <th className="py-3">Customer</th>
                      <th className="py-3">Date</th>
                      <th className="py-3">Value</th>
                      <th className="py-3">Status</th>
                      <th className="py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 dark:divide-slate-800">
                    {orders.length > 0 ? (
                      orders.map((o) => {
                        return (
                          <tr
                            key={o.id}
                            className={`hover:bg-slate-50/30 dark:hover:bg-slate-900/10 cursor-pointer ${selectedOrder?.id === o.id ? "bg-violet-500/5 dark:bg-violet-950/10" : ""
                              }`}
                            onClick={() => setSelectedOrder(o)}
                          >
                            <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">{o.orderNumber}</td>
                            <td className="py-3">
                              <div className="font-semibold">{o.customerName}</div>
                              <div className="text-[10px] text-slate-450">{o.customerEmail}</div>
                            </td>
                            <td className="py-3 text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                            <td className="py-3 font-mono font-semibold">₹{o.totalAmount.toFixed(2)}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${o.status === "Cancelled"
                                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                                  : o.status === "Delivered"
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                    : "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400"
                                }`}>
                                {o.status}
                              </span>
                            </td>
                            <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => handlePrint(o)}
                                  className="p-1 border scribble-border hover:bg-slate-100 text-slate-500 inline-flex"
                                  title="Print PDF Invoice"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setSelectedOrder(o)}
                                  className="p-1 border scribble-border hover:bg-slate-100 text-slate-505 inline-flex"
                                >
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-400 font-bold">
                          No active orders exist in the database pipeline.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* INTERACTIVE TIMELINE VIEW */}
            <div className="p-5 bg-card scribble-card font-scribble">
              <h2 className="text-md font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
                <Calendar className="w-5 h-5 text-violet-500" />
                Fulfillment Timeline
              </h2>

              {selectedOrder ? (
                <div className="space-y-6 text-xs">
                  {/* Status controllers */}
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 scribble-border space-y-3">
                    <div className="font-semibold text-slate-850 dark:text-slate-100">Pipeline Controllers</div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedOrder.status !== "Delivered" && selectedOrder.status !== "Cancelled" && (
                        <>
                          <button
                            onClick={() => handleAdvanceStatus(selectedOrder.id, selectedOrder.status)}
                            disabled={submitting}
                            className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-slate-950 font-black rounded-lg text-[10px] scribble-button cursor-pointer disabled:opacity-60 transition-all"
                          >
                            {submitting ? "Processing..." : "Advance Stage"}
                          </button>
                          <button
                            onClick={() => handleCancelOrder(selectedOrder.id)}
                            disabled={submitting}
                            className="py-2 px-3 border border-rose-500 text-rose-500 hover:bg-rose-500/10 font-semibold rounded-lg text-[10px] scribble-button cursor-pointer disabled:opacity-60 transition-all"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handlePrint(selectedOrder)}
                        className="w-full mt-2 py-2 border scribble-border hover:bg-slate-100 text-slate-700 dark:text-slate-350 font-semibold rounded-lg text-[10px] flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Invoice PDF</span>
                      </button>
                    </div>
                  </div>

                  {/* Vertical timeline details */}
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                    {selectedOrder.status === "Cancelled" ? (
                      <div className="relative flex gap-4">
                        <div className="absolute -left-[23px] w-4 h-4 rounded-full bg-rose-505 border-4 border-slate-50 dark:border-slate-900 z-10 animate-pulse" />
                        <div>
                          <h4 className="font-bold text-rose-500 flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5" />
                            Order Cancelled
                          </h4>
                          <p className="text-slate-400 mt-1">This transaction was terminated. Stock inventory has been returned.</p>
                        </div>
                      </div>
                    ) : (
                      stages.map((stage, idx) => {
                        const orderIdx = stages.findIndex((s) => s.key === selectedOrder.status);
                        const isCompleted = idx < orderIdx;
                        const isCurrent = idx === orderIdx;
                        const isPending = idx > orderIdx;

                        return (
                          <div key={idx} className="relative flex gap-4">
                            <div className={`absolute -left-[23px] w-4 h-4 rounded-full border-4 border-slate-50 dark:border-slate-900 z-10 transition-colors duration-300 ${isCompleted
                                ? "bg-emerald-500"
                                : isCurrent
                                  ? "bg-violet-600 ring-2 ring-violet-500/20"
                                  : "bg-slate-300 dark:bg-slate-800"
                              }`} />

                            <div className={isPending ? "opacity-50" : ""}>
                              <h4 className={`font-bold flex items-center gap-1.5 ${isCompleted
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : isCurrent
                                    ? "text-violet-600"
                                    : "text-slate-600"
                                }`}>
                                <stage.icon className="w-3.5 h-3.5" />
                                {stage.label}
                              </h4>
                              <p className="text-slate-400 mt-1 leading-normal">{stage.desc}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-450 py-16 text-xs font-bold">
                  Select an order from the list to display tracking details.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

