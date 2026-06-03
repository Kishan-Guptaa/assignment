"use client";

import React, { useState } from "react";
import { User, Mail, Phone, ShieldCheck, ShoppingBag, ShieldAlert, BadgeCheck, Building2, FileText, CheckCircle2, ExternalLink, Edit2, Save, X } from "lucide-react";
import { updateUserProfile } from "@/lib/actions/auth";
import { useRouter } from "next/navigation";

export default function ProfileClient({ user }: { user: any }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || "");
  const [companyName, setCompanyName] = useState(user.companyName || "");
  const [gstNumber, setGstNumber] = useState(user.gstNumber || "");
  const [licenseUrl, setLicenseUrl] = useState(user.licenseUrl || "");

  const handleSave = async () => {
    setLoading(true);
    const result = await updateUserProfile(user.id, {
      name,
      email,
      phone,
      companyName,
      gstNumber,
      licenseUrl,
    });
    setLoading(false);

    if (result.success) {
      setIsEditing(false);
      router.refresh();
    } else {
      alert(result.message);
    }
  };

  const handleCancel = () => {
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone || "");
    setCompanyName(user.companyName || "");
    setGstNumber(user.gstNumber || "");
    setLicenseUrl(user.licenseUrl || "");
    setIsEditing(false);
  };

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl relative overflow-hidden">
      {/* Decorative background circle */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-gradient-to-br from-violet-500/10 to-transparent blur-3xl pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-8 border-b border-slate-100 dark:border-slate-800">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-violet-500/30">
          {name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {name}
            <BadgeCheck className="w-5 h-5 text-emerald-500" />
          </h2>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-400">
            {user.role === "admin" && <ShieldCheck className="w-4 h-4" />}
            {user.role === "seller" && <ShieldAlert className="w-4 h-4" />}
            {user.role === "customer" && <ShoppingBag className="w-4 h-4" />}
            {user.role} Account
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8">
        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <User className="w-3.5 h-3.5" /> Full Name
            </label>
            {isEditing ? (
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full font-medium text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 px-4 py-3 rounded-xl border border-violet-300 dark:border-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500" />
            ) : (
              <div className="font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {name}
              </div>
            )}
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Mail className="w-3.5 h-3.5" /> Email Address
            </label>
            {isEditing ? (
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full font-medium text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 px-4 py-3 rounded-xl border border-violet-300 dark:border-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500" />
            ) : (
              <div className="font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {email}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Phone className="w-3.5 h-3.5" /> Phone Number
            </label>
            {isEditing ? (
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full font-medium text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 px-4 py-3 rounded-xl border border-violet-300 dark:border-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500" />
            ) : (
              <div className="font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {phone || <span className="text-slate-400 italic">Not provided</span>}
              </div>
            )}
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" /> Account ID
            </label>
            <div className="font-mono text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800 opacity-70">
              #{user.id.toString().padStart(4, '0')} <span className="text-[10px] ml-2 text-slate-500">(Cannot be changed)</span>
            </div>
          </div>
        </div>
      </div>

      {(user.role === 'seller' || companyName || gstNumber || licenseUrl || isEditing) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-t border-slate-100 dark:border-slate-800">
          <div className="space-y-6">
            {(companyName || isEditing) && (
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Building2 className="w-3.5 h-3.5" /> Company Name
                </label>
                {isEditing ? (
                  <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full font-medium text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 px-4 py-3 rounded-xl border border-violet-300 dark:border-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500" />
                ) : (
                  <div className="font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    {companyName}
                  </div>
                )}
              </div>
            )}
            {(licenseUrl || isEditing) && (
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Business License URL
                </label>
                {isEditing ? (
                  <input type="text" value={licenseUrl} onChange={(e) => setLicenseUrl(e.target.value)} className="w-full font-medium text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 px-4 py-3 rounded-xl border border-violet-300 dark:border-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500" />
                ) : (
                  <div className="font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <a href={licenseUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400 hover:underline">
                      View Document <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="space-y-6">
            {(gstNumber || isEditing) && (
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <FileText className="w-3.5 h-3.5" /> GST Number
                </label>
                {isEditing ? (
                  <input type="text" value={gstNumber} onChange={(e) => setGstNumber(e.target.value.toUpperCase())} className="w-full uppercase font-mono text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 px-4 py-3 rounded-xl border border-violet-300 dark:border-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500" />
                ) : (
                  <div className="font-mono text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    {gstNumber}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
        {isEditing ? (
          <>
            <button 
              onClick={handleCancel}
              disabled={loading}
              className="px-6 py-2.5 flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm transition-colors"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2.5 flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-slate-950 font-black rounded-xl text-sm transition-colors shadow-lg shadow-violet-500/20 disabled:opacity-50 scribble-button"
            >
              <Save className="w-4 h-4 text-slate-950" /> {loading ? "Saving..." : "Save Changes"}
            </button>
          </>
        ) : (
          <button 
            onClick={() => setIsEditing(true)}
            className="px-6 py-2.5 flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-slate-950 font-black rounded-xl text-sm transition-colors shadow-lg shadow-violet-500/20 scribble-button"
          >
            <Edit2 className="w-4 h-4 text-slate-950" /> Edit Profile
          </button>
        )}
      </div>
    </div>
  );
}
