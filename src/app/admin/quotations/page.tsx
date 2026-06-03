"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  CheckCircle,
  XCircle,
  FileClock,
  ClipboardList,
  Eye,
  Info,
  AlertTriangle
} from "lucide-react";
import { getCurrentUser } from "@/lib/actions/auth";
import {
  getQuotationsList,
  approveQuotationAction,
  rejectQuotationAction,
  convertQuotationToOrderAction
} from "@/lib/actions/quotationActions";
import { getProductsList } from "@/lib/actions/inventoryActions";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export default function QuotationsManagement() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Database-backed states
  const [activeUser, setActiveUser] = useState<any>(null);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);

  // Load database lists
  async function loadData() {
    try {
      const user = await getCurrentUser();
      setActiveUser(user);
      if (user && user.role !== "customer") {
        const qList = await getQuotationsList();
        setQuotations(qList);
        const pList = await getProductsList();
        setProducts(pList);
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

  const handleApprove = async (id: number) => {
    if (!selectedQuote) return;
    setSubmitting(true);
    await approveQuotationAction(id);
    await loadData();
    // Refresh selected quote details view
    const qList = await getQuotationsList();
    const updatedQuote = qList.find((q) => q.id === id);
    setSelectedQuote(updatedQuote || null);
    setSubmitting(false);
  };

  const handleReject = async (id: number) => {
    if (!selectedQuote) return;
    setSubmitting(true);
    await rejectQuotationAction(id);
    await loadData();
    const qList = await getQuotationsList();
    const updatedQuote = qList.find((q) => q.id === id);
    setSelectedQuote(updatedQuote || null);
    setSubmitting(false);
  };

  const handleConvertToOrder = async (id: number) => {
    if (!selectedQuote) return;
    setSubmitting(true);
    const result = await convertQuotationToOrderAction(id);
    setSubmitting(false);
    if (result.success) {
      await loadData();
      const qList = await getQuotationsList();
      const updatedQuote = qList.find((q) => q.id === id);
      setSelectedQuote(updatedQuote || null);
    } else {
      alert(result.message || "Failed to convert quote to order. Stock levels may be too low.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex relative">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-[1600px] mx-auto w-full space-y-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Customer Quotations Inbox</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Review, approve, and convert chemical purchase quote requests</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* INCOMING LISTS TABLE */}
            <div className="lg:col-span-2 p-5 bg-card scribble-card font-scribble">
              <h2 className="text-md font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                <FileClock className="w-5 h-5 text-violet-500" />
                Submitted Quotations
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-900 dark:border-slate-800 text-slate-405 font-bold uppercase">
                      <th className="py-3">Quote ID</th>
                      <th className="py-3">Customer Account</th>
                      <th className="py-3">Total Amount</th>
                      <th className="py-3">Status</th>
                      <th className="py-3 text-right">Inspection</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 dark:divide-slate-800">
                    {quotations.length > 0 ? (
                      quotations.map((q) => {
                        return (
                          <tr
                            key={q.id}
                            className={`hover:bg-slate-50/30 dark:hover:bg-slate-900/10 cursor-pointer ${selectedQuote?.id === q.id ? "bg-violet-500/5 dark:bg-violet-950/10" : ""
                              }`}
                            onClick={() => setSelectedQuote(q)}
                          >
                            <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">{q.quotationNumber}</td>
                            <td className="py-3">
                              <div className="font-semibold">{q.customerName}</div>
                              <div className="text-[10px] text-slate-450">{q.customerEmail}</div>
                            </td>
                            <td className="py-3 font-mono font-semibold">₹{q.totalAmount.toFixed(2)}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${q.status === "Pending"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                                  : q.status === "Approved"
                                    ? "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400"
                                    : q.status === "Converted_To_Order"
                                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                      : "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                                }`}>
                                {q.status}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedQuote(q);
                                }}
                                className="p-1 border border-transparent hover:border-slate-405 rounded text-slate-400"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-slate-400 font-bold">
                          No quotation requests have been submitted to database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DETAILED INSPECTION */}
            <div className="p-5 bg-card scribble-card font-scribble">
              <h2 className="text-md font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-violet-500" />
                Quote Inspector
              </h2>

              {selectedQuote ? (
                <div className="space-y-6 text-xs">
                  {/* Summary */}
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 scribble-border space-y-2">
                    <div className="flex justify-between items-center text-slate-500 font-semibold">
                      <span>Quote Code</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedQuote.quotationNumber}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 font-semibold">
                      <span>Status</span>
                      <span className="capitalize font-semibold text-slate-800 dark:text-slate-200">{selectedQuote.status}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 font-semibold border-t dark:border-slate-800 pt-2">
                      <span className="font-bold text-slate-805">Grand Total</span>
                      <span className="font-mono font-extrabold text-violet-600 dark:text-violet-400 text-sm">₹{selectedQuote.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div>
                    <h3 className="text-[10px] font-bold text-slate-450 uppercase mb-2">Requested Chemicals</h3>
                    <div className="space-y-3">
                      {selectedQuote.items.map((item: any, index: number) => {
                        const prod = products.find((p) => p.id === item.productId);
                        return (
                          <div key={index} className="p-3 bg-white dark:bg-slate-950/20 scribble-border">
                            <div className="font-bold text-slate-850 dark:text-slate-200">{prod?.name || "Unknown Chemical"}</div>
                            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5">
                              <span>Quantity requested:</span>
                              <span className="font-semibold">
                                {item.quantity} {item.unit}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                              <span>Unit rate (conversions):</span>
                              <span className="font-mono font-semibold">₹{item.rate.toFixed(3)} / {item.unit}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 border-t dark:border-slate-900 pt-1.5">
                              <span className="font-semibold">Subtotal:</span>
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">₹{item.subtotal.toFixed(2)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Inspector Actions */}
                  <div className="pt-4 border-t-2 border-dashed border-slate-900 dark:border-slate-800 space-y-2">
                    {selectedQuote.status === "Pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(selectedQuote.id)}
                          disabled={submitting}
                          className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-slate-950 font-black flex items-center justify-center gap-1 scribble-button cursor-pointer disabled:opacity-60 transition-all"
                        >
                          <CheckCircle className="w-4 h-4 text-slate-950" />
                          <span>{submitting ? "Approving..." : "Approve Quote"}</span>
                        </button>
                        <button
                          onClick={() => handleReject(selectedQuote.id)}
                          disabled={submitting}
                          className="flex-1 py-2 border-2 border-rose-500 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold flex items-center justify-center gap-1 scribble-button cursor-pointer disabled:opacity-60 transition-all"
                        >
                          <XCircle className="w-4 h-4 text-rose-705" />
                          <span>{submitting ? "Declining..." : "Decline"}</span>
                        </button>
                      </div>
                    )}

                    {selectedQuote.status === "Approved" && (
                      <button
                        onClick={() => handleConvertToOrder(selectedQuote.id)}
                        disabled={submitting}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-black flex items-center justify-center gap-1.5 scribble-button cursor-pointer disabled:opacity-60 transition-all"
                      >
                        <ClipboardList className="w-4 h-4 text-slate-950" />
                        <span>{submitting ? "Converting..." : "Convert to Order"}</span>
                      </button>
                    )}

                    {selectedQuote.status === "Converted_To_Order" && (
                      <div className="p-3 text-center bg-emerald-500/10 border border-emerald-500 text-emerald-600 dark:text-emerald-450 font-bold rounded-lg flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>Order generated. Invoice ready.</span>
                      </div>
                    )}

                    {selectedQuote.status === "Rejected" && (
                      <div className="p-3 text-center bg-rose-500/10 border border-rose-500 text-rose-500 font-bold rounded-lg flex items-center justify-center gap-2">
                        <XCircle className="w-4 h-4" />
                        <span>This request was rejected.</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-400 py-16 text-xs font-bold">
                  Select a quotation from the list to inspect chemical items.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

