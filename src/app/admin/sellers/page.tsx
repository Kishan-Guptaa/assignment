"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import { getSellers, approveSeller, rejectSeller } from "@/lib/actions/adminActions";
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Clock, Building2, FileText, ExternalLink, RefreshCw } from "lucide-react";

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadSellers = async () => {
    setLoading(true);
    const data = await getSellers();
    setSellers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadSellers();
  }, []);

  const handleApprove = async (id: number) => {
    setProcessingId(id);
    await approveSeller(id);
    await loadSellers();
    setProcessingId(null);
  };

  const handleReject = async (id: number) => {
    setProcessingId(id);
    await rejectSeller(id);
    await loadSellers();
    setProcessingId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-scribble">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-violet-600 dark:text-violet-500" />
              Seller Approvals
            </h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Review and verify seller registrations before they can access the inventory dashboard.</p>
          </div>
          <button 
            onClick={loadSellers}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-violet-600 hover:border-violet-200 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-violet-600' : ''}`} />
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Company Info</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">License / GST</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && sellers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">Loading sellers...</td>
                  </tr>
                ) : sellers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">No sellers found.</td>
                  </tr>
                ) : (
                  sellers.map((seller) => (
                    <tr key={seller.id} className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 font-black">
                            {seller.companyName ? seller.companyName.charAt(0).toUpperCase() : seller.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">{seller.companyName || <span className="text-slate-400 italic">No Company Name</span>}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Building2 className="w-3 h-3" /> Seller #{seller.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200 text-sm">{seller.name}</div>
                        <div className="text-xs text-slate-500">{seller.email}</div>
                        {seller.phone && <div className="text-xs text-slate-500 mt-0.5">{seller.phone}</div>}
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400" /> {seller.gstNumber || 'N/A'}
                        </div>
                        {seller.licenseUrl ? (
                          <a href={seller.licenseUrl} target="_blank" rel="noreferrer" className="text-xs text-violet-600 hover:text-violet-700 hover:underline flex items-center gap-1 mt-1">
                            <ExternalLink className="w-3 h-3" /> View License
                          </a>
                        ) : (
                          <div className="text-xs text-slate-400 mt-1">No license provided</div>
                        )}
                      </td>
                      <td className="p-4">
                        {seller.verificationStatus === 'approved' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                          </span>
                        )}
                        {seller.verificationStatus === 'rejected' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400">
                            <XCircle className="w-3.5 h-3.5" /> Rejected
                          </span>
                        )}
                        {(!seller.verificationStatus || seller.verificationStatus === 'pending') && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400">
                            <Clock className="w-3.5 h-3.5" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(!seller.verificationStatus || seller.verificationStatus === 'pending' || seller.verificationStatus === 'rejected') && (
                            <button
                              onClick={() => handleApprove(seller.id)}
                              disabled={processingId === seller.id}
                              className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </button>
                          )}
                          
                          {(!seller.verificationStatus || seller.verificationStatus === 'pending' || seller.verificationStatus === 'approved') && (
                            <button
                              onClick={() => handleReject(seller.id)}
                              disabled={processingId === seller.id}
                              className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
