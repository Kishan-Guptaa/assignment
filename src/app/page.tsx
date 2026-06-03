"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap,
  Scale,
  BellRing,
  CheckCircle,
  HelpCircle,
  FlaskConical,
  Activity,
  Layers,
  ChevronDown
} from "lucide-react";
import ChemicalCanvas from "@/components/ChemicalCanvas";
import Header from "@/components/Header";
import { getCurrentUser } from "@/lib/actions/auth";
import { getDBConversionFactor } from "@/lib/actions/inventoryActions";

export default function LandingPage() {
  const router = useRouter();
  const [activeUser, setActiveUser] = useState<any>(null);

  // Unit Converter Widget State
  const [convCategory, setConvCategory] = useState<"weight" | "volume">("weight");
  const [convAmount, setConvAmount] = useState<number>(1);
  const [convFrom, setConvFrom] = useState<string>("kg");
  const [convTo, setConvTo] = useState<string>("g");
  const [factor, setFactor] = useState<number>(1000);

  // Resolve session on mount
  useEffect(() => {
    async function loadUser() {
      const user = await getCurrentUser();
      setActiveUser(user);
    }
    loadUser();
  }, []);

  // Compute live conversions factor dynamically
  useEffect(() => {
    async function computeFactor() {
      const mult = await getDBConversionFactor(convFrom, convTo);
      setFactor(mult);
    }
    computeFactor();
  }, [convFrom, convTo]);

  const convResult = convAmount * factor;

  const handleCategoryChange = (cat: "weight" | "volume") => {
    setConvCategory(cat);
    if (cat === "weight") {
      setConvFrom("kg");
      setConvTo("g");
    } else {
      setConvFrom("L");
      setConvTo("mL");
    }
  };

  // How it works accordion active state
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  const steps = [
    {
      title: "1. Request a Quotation",
      desc: "Browse our expansive chemical database as a customer. Select your required quantity and packaging unit (e.g. grams, kilograms, milliliters, or liters) and add to cart to request a quote.",
    },
    {
      title: "2. Automatic Conversion & Matching",
      desc: "Our automated unit conversion engine translates requested packages into default base inventory metrics, calculates precise live rates, and registers stock feasibility immediately.",
    },
    {
      title: "3. Admin Review & Processing",
      desc: "Admins review quote requests, approve items, adjust specific custom rates, and convert quotes directly to Orders with a single click. Sellers fulfill shipments and restock inventory.",
    },
    {
      title: "4. Dispatched & Logged",
      desc: "Orders advance through standard fulfillment tracks (Pending -> Approved -> Processing -> Shipped -> Delivered) with persistent audit logs and real-time alerts.",
    },
  ];

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden">
      {/* Dynamic Animated molecular nodes in backdrop */}
      <ChemicalCanvas />

      {/* Global Header */}
      <Header />

      {/* HERO SECTION */}
      <section className="relative z-10 pt-20 pb-16 px-4 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-950/40 border border-violet-200/50 dark:border-violet-800/50 text-xs text-violet-700 dark:text-violet-400 mb-6 font-semibold animate-bounce">
          <FlaskConical className="w-3.5 h-3.5" />
          <span>The Chemistry Supply Chain, Solved.</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight max-w-4xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 dark:from-white dark:via-slate-100 dark:to-indigo-200 bg-clip-text text-transparent">
          Enterprise Chemical Inventory & Quotation Management
        </h1>

        <p className="mt-6 text-base sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
          Unify administrative controls, supplier listings, and customer quotation carts in a high-fidelity system designed for modern laboratories and chemical distributors.
        </p>

        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          {activeUser ? (
            <button
              onClick={() => {
                if (activeUser.role === "admin") router.push("/admin");
                else if (activeUser.role === "seller") router.push("/seller");
                else router.push("/customer");
              }}
              className="flex items-center gap-2 px-6 py-3 text-slate-950 font-black bg-violet-600 hover:bg-violet-700 scribble-button cursor-pointer"
            >
              <span>Go to Your {activeUser.role} Dashboard</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="flex items-center gap-2 px-6 py-3 text-slate-950 font-black bg-violet-600 hover:bg-violet-700 scribble-button cursor-pointer"
            >
              <span>Launch Quick Login Demo</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          )}
          <a
            href="#converter"
            className="px-6 py-3 bg-card text-slate-950 font-black dark:text-white dark:bg-slate-800 scribble-button flex items-center justify-center"
          >
            Try Unit Converter
          </a>
        </div>

        {/* Floating Mockup Preview Grid */}
        <div className="mt-16 w-full max-w-5xl rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/30 p-2 shadow-2xl backdrop-blur-md">
          <div className="rounded-xl overflow-hidden bg-slate-950 p-6 text-left border border-slate-800 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-500 ml-2 font-mono">system_status: active</span>
              </div>
              <div className="text-xs text-slate-400 font-semibold px-2 py-1 bg-slate-900 rounded border border-slate-800">
                Active Console: Dr. Clara Sterling (Admin)
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Products cataloged</span>
                <div className="text-2xl font-bold mt-1 text-white">6 High-Purity Reagents</div>
                <div className="text-xs text-emerald-400 mt-1">&uarr; 100% database match</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Stock Valuation</span>
                <div className="text-2xl font-bold mt-1 text-white">₹9,680.00</div>
                <div className="text-xs text-slate-400 mt-1">Automatic matching</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Audit Log Status</span>
                <div className="text-2xl font-bold mt-1 text-violet-400">Security Enabled</div>
                <div className="text-xs text-slate-400 mt-1">100% action traceability</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES SECTION */}
      <section className="relative z-10 py-20 px-4 bg-slate-100/50 dark:bg-slate-900/20 border-y border-slate-200/50 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Engineered for Laboratory Integrity</h2>
            <p className="mt-4 text-slate-500 dark:text-slate-400">
              AasaMedChem solves chemical supply chain mismatches by implementing unified packaging tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl glass-card hover:border-violet-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Smart Unit Conversions</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Automatically convert kilograms to grams and liters to milliliters on the fly. View instant conversions and billing rates.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl glass-card hover:border-violet-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Role-Based Workflows</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Separate interfaces for Administrators (approvals, users, logs), Sellers (listings, stock), and Customers (browsing, carts, orders).
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl glass-card hover:border-violet-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <BellRing className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Real-Time Alerts</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Receive notifications when warehouse item balances drop below threshold limits. Prevent stockouts of critical compounds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PLAYGROUND UNIT CONVERTER WIDGET */}
      <section id="converter" className="relative z-10 py-20 px-4 max-w-5xl mx-auto">
        <div className="rounded-2xl border border-violet-200/50 dark:border-violet-800/60 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950/80 p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b dark:border-slate-800 pb-6 mb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="w-6 h-6 text-violet-500" />
                Live Conversion Engine
              </h2>
              <p className="text-xs text-slate-500 mt-1">Play with our conversion calculator to preview database rates</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleCategoryChange("weight")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  convCategory === "weight"
                    ? "bg-violet-600 border-violet-600 text-white shadow"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                }`}
              >
                Weight (g / kg)
              </button>
              <button
                onClick={() => handleCategoryChange("volume")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  convCategory === "volume"
                    ? "bg-violet-600 border-violet-600 text-white shadow"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                }`}
              >
                Volume (mL / L)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quantity to Convert</label>
              <input
                type="number"
                min="0.0001"
                step="any"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={convAmount}
                onChange={(e) => setConvAmount(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">From Unit</label>
              <select
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={convFrom}
                onChange={(e) => {
                  setConvFrom(e.target.value);
                  setConvTo(e.target.value === "kg" ? "g" : e.target.value === "g" ? "kg" : e.target.value === "L" ? "mL" : "L");
                }}
              >
                {convCategory === "weight" ? (
                  <>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="g">Grams (g)</option>
                  </>
                ) : (
                  <>
                    <option value="L">Liters (L)</option>
                    <option value="mL">Milliliters (mL)</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">To Unit</label>
              <select
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={convTo}
                onChange={(e) => {
                  setConvTo(e.target.value);
                  setConvFrom(e.target.value === "kg" ? "g" : e.target.value === "g" ? "kg" : e.target.value === "L" ? "mL" : "L");
                }}
              >
                {convCategory === "weight" ? (
                  <>
                    <option value="g">Grams (g)</option>
                    <option value="kg">Kilograms (kg)</option>
                  </>
                ) : (
                  <>
                    <option value="mL">Milliliters (mL)</option>
                    <option value="L">Liters (L)</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="mt-8 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-violet-500 tracking-wider">Converted Result</span>
              <div className="text-xl sm:text-2xl font-bold text-violet-600 dark:text-violet-400 mt-1">
                {convAmount} {convFrom} = <span className="underline decoration-double">{convResult.toFixed(4)}</span> {convTo}
              </div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 max-w-sm sm:text-right">
              Rate Multiplier Factor: <span className="font-mono font-bold">{factor}</span>
              <br />
              Formula: Quantity &times; Factor = Converted Quantity
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="relative z-10 py-20 px-4 bg-slate-100/50 dark:bg-slate-900/20 border-t border-slate-200/50 dark:border-slate-800/80">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight">The Procurement Lifecycle</h2>
            <p className="mt-4 text-slate-500">How quotations flow seamlessly into orders.</p>
          </div>

          <div className="space-y-4">
            {steps.map((step, idx) => {
              const isOpen = faqOpen === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden"
                >
                  <button
                    onClick={() => setFaqOpen(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
                  >
                    <span>{step.title}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="p-5 pt-0 text-sm text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-900">
                      {step.desc}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section className="relative z-10 py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight">Clear Pricing for Labs of Any Scale</h2>
          <p className="mt-4 text-slate-500 dark:text-slate-400">Scale permissions as your inventory needs grow.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Plan 1 */}
          <div className="p-6 rounded-2xl glass-card flex flex-col justify-between relative">
            <div>
              <h3 className="text-lg font-bold">Starter</h3>
              <p className="text-slate-400 text-xs mt-1">For single academic research groups</p>
              <div className="my-6">
                <span className="text-4xl font-black">₹49</span>
                <span className="text-slate-400 text-xs"> / month</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-violet-500" /> Up to 500 chemical items</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-violet-500" /> Standard conversion engine</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-violet-500" /> 2 Administrator roles</li>
              </ul>
            </div>
            <button className="mt-8 w-full py-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-950 font-black text-xs scribble-button transition-all">
              Get Started
            </button>
          </div>
 
           {/* Plan 2 */}
           <div className="p-6 rounded-2xl glass-card flex flex-col justify-between border-violet-600/50 dark:border-violet-500 relative">
             <span className="absolute top-0 right-6 transform -translate-y-1/2 px-2.5 py-0.5 rounded-full bg-violet-600 text-[10px] text-slate-950 font-black tracking-wider uppercase">
               Popular
             </span>
             <div>
               <h3 className="text-lg font-bold">Professional</h3>
               <p className="text-slate-400 text-xs mt-1">For mid-scale labs & distributors</p>
               <div className="my-6">
                 <span className="text-4xl font-black">₹199</span>
                 <span className="text-slate-400 text-xs"> / month</span>
               </div>
               <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                 <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-violet-500" /> Unlimited chemicals</li>
                 <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-violet-500" /> Advanced conversion engine</li>
                 <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-violet-500" /> Unlimited Sellers & Customers</li>
                 <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-violet-500" /> Low stock alert automation</li>
               </ul>
             </div>
             <button className="mt-8 w-full py-2.5 rounded-lg bg-violet-500 hover:bg-violet-600 text-slate-950 font-black text-xs scribble-button transition-all">
               Get Started
             </button>
           </div>
 
           {/* Plan 3 */}
           <div className="p-6 rounded-2xl glass-card flex flex-col justify-between relative">
             <div>
               <h3 className="text-lg font-bold">Enterprise</h3>
               <p className="text-slate-400 text-xs mt-1">For multinational pharma & logistics</p>
               <div className="my-6">
                 <span className="text-4xl font-black">Custom</span>
               </div>
               <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                 <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-violet-500" /> Multi-site warehouse sync</li>
                 <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-violet-500" /> Dedicated database cluster</li>
                 <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-violet-500" /> SLA support guarantees</li>
                 <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-violet-500" /> Custom API hooks</li>
               </ul>
             </div>
             <button className="mt-8 w-full py-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-950 font-black text-xs scribble-button transition-all">
               Contact Sales
             </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 py-12 px-4 border-t border-slate-200 dark:border-slate-800 bg-slate-900 dark:bg-slate-950 text-slate-400 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-violet-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">AM</span>
            </div>
            <span className="font-bold text-white text-md">AasaMedChem IMS</span>
          </div>

          <p className="text-xs">&copy; 2026 AasaMedChem Inc. All rights reserved. Automated Inventory &amp; Quotations.</p>

          <div className="flex gap-4 text-xs">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Support Portal</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

