"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ShieldAlert,
  ShoppingBag,
  ArrowRight,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  Building2,
  LockKeyhole,
  CheckCircle2,
  FileText,
  Boxes,
  Truck,
  Layers,
  FlaskConical
} from "lucide-react";
import ChemicalCanvas from "@/components/ChemicalCanvas";
import { loginUser, signupUser, quickLoginDemo } from "@/lib/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  
  // Tab control: "signin" | "signup"
  const [activeTab, setActiveTab] = useState<"signup" | "signin">("signup");
  
  // Input fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [licenseUrl, setLicenseUrl] = useState("");
  const [roleId, setRoleId] = useState<number>(3); // 3 = User/Customer, 2 = Seller, 1 = Admin
  const [agree, setAgree] = useState(false);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Feedback states
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  // Sign In submit
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    const result = await loginUser(email, password);
    setLoading(false);

    if (result.success) {
      setInfo("Success! Directing to portal...");
      setTimeout(() => {
        if (email.toLowerCase().includes("admin")) {
          router.push("/admin");
        } else if (email.toLowerCase().includes("seller")) {
          router.push("/seller");
        } else {
          router.push("/customer");
        }
        router.refresh();
      }, 500);
    } else {
      setError(result.message || "Failed to authenticate.");
    }
  };

  // Sign Up submit
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agree) {
      setError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setLoading(true);
    const result = await signupUser({
      name,
      email,
      passwordText: password,
      roleId,
      phone,
      companyName: company,
      gstNumber,
      licenseUrl,
    });
    setLoading(false);

    if (result.success) {
      setInfo("Account registered! Opening portal...");
      setTimeout(() => {
        if (roleId === 1) router.push("/admin");
        else if (roleId === 2) router.push("/seller");
        else router.push("/customer");
        router.refresh();
      }, 500);
    } else {
      setError(result.message || "Registration failed.");
    }
  };

  // Quick Demo Login bypass
  const handleQuickLogin = async (quickEmail: string) => {
    setError("");
    setInfo("Syncing Neon database bypass...");
    setLoading(true);

    const result = await quickLoginDemo(quickEmail);
    setLoading(false);

    if (result.success) {
      if (quickEmail.includes("admin")) {
        router.push("/admin");
      } else if (quickEmail.includes("seller")) {
        router.push("/seller");
      } else {
        router.push("/customer");
      }
      router.refresh();
    } else {
      setError(result.message || "Failed to load sandbox credentials.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background text-foreground font-scribble transition-colors duration-200">
      {/* LEFT SPLIT PANEL: Purple Brand & Features */}
      <div className="relative w-full lg:w-[35%] xl:w-[30%] bg-gradient-to-b from-indigo-950 via-purple-900 to-indigo-950 text-white p-8 sm:p-12 flex flex-col justify-between overflow-hidden shadow-2xl shrink-0 border-b-2 lg:border-b-0 lg:border-r-2 border-slate-900 dark:border-white">
        {/* Atomic Canvas backdrop animation */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <ChemicalCanvas />
        </div>

        {/* Brand Logo Header */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20">
            <FlaskConical className="w-5 h-5 text-indigo-200" />
          </div>
          <div>
            <span className="font-black text-lg tracking-wide block">AasaMedChem</span>
            <span className="text-[9px] text-indigo-300 block -mt-1 font-medium font-sans">Smart Chemicals. Smart Business.</span>
          </div>
        </div>

        {/* Feature List Section */}
        <div className="relative z-10 my-12 space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight leading-tight">Create your account</h2>
            <p className="mt-3 text-indigo-200/80 text-xs sm:text-sm leading-relaxed font-sans font-medium">
              Join AasaMedChem and streamline your chemical inventory and order management.
            </p>
          </div>

          <div className="space-y-6 pt-4">
            {/* Feature 1 */}
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shrink-0 scribble-border">
                <Boxes className="w-5 h-5 text-indigo-200" />
              </div>
              <div>
                <h4 className="font-bold text-xs">Manage Inventory</h4>
                <p className="text-[10px] text-indigo-200/70 mt-1 leading-normal font-sans">
                  Track chemical inventory in multiple units with real-time stock updates.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shrink-0 scribble-border">
                <FileText className="w-5 h-5 text-indigo-200" />
              </div>
              <div>
                <h4 className="font-bold text-xs">Smart Quotations</h4>
                <p className="text-[10px] text-indigo-200/70 mt-1 leading-normal font-sans">
                  Create and manage quotations with automatic unit conversion and pricing.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shrink-0 scribble-border">
                <ShoppingBag className="w-5 h-5 text-indigo-200" />
              </div>
              <div>
                <h4 className="font-bold text-xs">Order Management</h4>
                <p className="text-[10px] text-indigo-200/70 mt-1 leading-normal font-sans">
                  Seamless order processing from quotation to delivery with status tracking.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shrink-0 scribble-border">
                <ShieldCheck className="w-5 h-5 text-indigo-200" />
              </div>
              <div>
                <h4 className="font-bold text-xs">Secure & Reliable</h4>
                <p className="text-[10px] text-indigo-200/70 mt-1 leading-normal font-sans">
                  Your data is protected with enterprise-grade security and best practices.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-[10px] text-indigo-300/60 font-mono">
          Neon Serverless DB Mode &bull; SSL Encrypted
        </div>
      </div>

      {/* RIGHT SPLIT PANEL: Form inputs */}
      <div className="flex-1 flex flex-col justify-between p-8 sm:p-12 bg-background overflow-y-auto">
        {/* Top Header Toggle buttons */}
        <div className="flex justify-end items-center gap-3 text-xs mb-8">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            {activeTab === "signup" ? "Already have an account?" : "Don't have an account?"}
          </span>
          <button
            onClick={() => {
              setActiveTab(activeTab === "signup" ? "signin" : "signup");
              setError("");
              setInfo("");
            }}
            className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-200 dark:hover:bg-slate-300 text-slate-950 font-black rounded-lg transition-all cursor-pointer scribble-button text-xs"
          >
            {activeTab === "signup" ? "Sign in" : "Create Account"}
          </button>
        </div>

        <div className="w-full max-w-2xl mx-auto my-auto space-y-8">
          {/* Header Title */}
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {activeTab === "signup" ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans font-semibold">
              {activeTab === "signup" ? "Fill in the details below to create your account" : "Fill in your credentials to access the chemical dashboard"}
            </p>
          </div>

          {/* Feedback alerts */}
          {error && (
            <div className="p-3.5 bg-rose-500/10 border-2 border-rose-500 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2 scribble-border">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {info && (
            <div className="p-3.5 bg-emerald-500/10 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2 animate-pulse scribble-border">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{info}</span>
            </div>
          )}

          {/* FORM ROOT */}
          {activeTab === "signup" ? (
            /* ================= REGISTER VIEW ================= */
            <form onSubmit={handleSignUp} className="space-y-6">
              {/* Role Selectors */}
              <div className="space-y-2.5">
                <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider">Choose your role</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: Customer */}
                  <div
                    onClick={() => setRoleId(3)}
                    className={`p-4 cursor-pointer transition-all flex flex-col justify-between min-h-[120px] relative scribble-card ${
                      roleId === 3
                        ? "border-violet-600 ring-2 ring-violet-500/20"
                        : "opacity-75"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center scribble-border">
                        <User className="w-4 h-4" />
                      </div>
                      <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center ${
                        roleId === 3 ? "border-violet-600 bg-violet-600" : "border-slate-400"
                      }`}>
                        {roleId === 3 && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="font-bold text-xs text-slate-900 dark:text-white">User / Customer</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-normal font-sans">Browse products, request quotations and place orders.</div>
                    </div>
                  </div>

                  {/* Card 2: Seller */}
                  <div
                    onClick={() => setRoleId(2)}
                    className={`p-4 cursor-pointer transition-all flex flex-col justify-between min-h-[120px] relative scribble-card ${
                      roleId === 2
                        ? "border-violet-600 ring-2 ring-violet-500/20"
                        : "opacity-75"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-650 dark:text-indigo-400 flex items-center justify-center scribble-border">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center ${
                        roleId === 2 ? "border-violet-600 bg-violet-600" : "border-slate-400"
                      }`}>
                        {roleId === 2 && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="font-bold text-xs text-slate-900 dark:text-white">Seller</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-normal font-sans">Manage products, inventory and process orders.</div>
                    </div>
                  </div>

                  {/* Card 3: Admin */}
                  <div
                    onClick={() => setRoleId(1)}
                    className={`p-4 cursor-pointer transition-all flex flex-col justify-between min-h-[120px] relative scribble-card ${
                      roleId === 1
                        ? "border-violet-600 ring-2 ring-violet-500/20"
                        : "opacity-75"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-650 dark:text-purple-400 flex items-center justify-center scribble-border">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center ${
                        roleId === 1 ? "border-violet-600 bg-violet-600" : "border-slate-400"
                      }`}>
                        {roleId === 1 && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="font-bold text-xs text-slate-900 dark:text-white">Admin</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-normal font-sans">Manage system, users, inventory and all operations.</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Input fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Enter your full name"
                      className="w-full pl-10 pr-4 py-3 scribble-input bg-card text-foreground text-xs"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="Enter your email address"
                      className="w-full pl-10 pr-4 py-3 scribble-input bg-card text-foreground text-xs"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Enter your phone number"
                      className="w-full pl-10 pr-4 py-3 scribble-input bg-card text-foreground text-xs"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Create a password"
                      className="w-full pl-10 pr-10 py-3 scribble-input bg-card text-foreground text-xs"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Confirm Password</label>
                  <div className="relative">
                    <LockKeyhole className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="Confirm your password"
                      className="w-full pl-10 pr-10 py-3 scribble-input bg-card text-foreground text-xs"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Company / Organization (Optional) */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">{roleId === 2 ? "Company Name (Required)" : "Company / Organization (Optional)"}</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required={roleId === 2}
                      placeholder={roleId === 2 ? "Enter registered company name" : "Enter company or organization"}
                      className="w-full pl-10 pr-4 py-3 scribble-input bg-card text-foreground text-xs"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>
                </div>

                {roleId === 2 && (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">GST Number (Required)</label>
                      <div className="relative">
                        <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          placeholder="Enter 15-digit GSTIN"
                          className="w-full pl-10 pr-4 py-3 scribble-input bg-card text-foreground text-xs uppercase"
                          value={gstNumber}
                          onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Business License Document Link (Required)</label>
                      <div className="relative">
                        <CheckCircle2 className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                        <input
                          type="url"
                          required
                          placeholder="Provide a cloud link (e.g. Google Drive/Dropbox)"
                          className="w-full pl-10 pr-4 py-3 scribble-input bg-card text-foreground text-xs"
                          value={licenseUrl}
                          onChange={(e) => setLicenseUrl(e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Agreement checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="agree-checkbox"
                  className="rounded border-2 border-slate-900 dark:border-slate-600 text-violet-600 focus:ring-violet-500 cursor-pointer"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                />
                <label htmlFor="agree-checkbox" className="text-[10px] text-slate-600 dark:text-slate-400 cursor-pointer font-sans font-medium">
                  I agree to the <span className="text-violet-600 dark:text-violet-400 font-semibold hover:underline">Terms of Service</span> and <span className="text-violet-600 dark:text-violet-400 font-semibold hover:underline">Privacy Policy</span>
                </label>
              </div>

              {/* Submit button with black text */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-slate-950 font-black cursor-pointer text-xs disabled:opacity-50 scribble-button shadow-md"
              >
                {loading ? "Registering account..." : "Create Account"}
              </button>
            </form>
          ) : (
            /* ================= LOGIN VIEW ================= */
            <form onSubmit={handleSignIn} className="space-y-6">
              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    className="w-full pl-10 pr-4 py-3 scribble-input bg-card text-foreground text-xs"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-3 scribble-input bg-card text-foreground text-xs"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-655 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit button with black text */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-slate-950 font-black cursor-pointer text-xs disabled:opacity-50 scribble-button shadow-md"
              >
                {loading ? "Authenticating DB..." : "Sign In"}
              </button>
            </form>
          )}

          {/* Sandbox Bypasses (Bottom of card) */}
          <div className="pt-6 border-t border-slate-900 dark:border-slate-800">
            <h3 className="text-center text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
              Developer Sandbox Bypasses (Auto Neon Creation)
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleQuickLogin("admin@aasamedchem.com")}
                className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-950 font-black text-[10px] text-center cursor-pointer transition-all scribble-button shadow-sm"
              >
                Admin
              </button>
              <button
                onClick={() => handleQuickLogin("seller@aasamedchem.com")}
                className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-950 font-black text-[10px] text-center cursor-pointer transition-all scribble-button shadow-sm"
              >
                Seller
              </button>
              <button
                onClick={() => handleQuickLogin("customer@labtech.com")}
                className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-950 font-black text-[10px] text-center cursor-pointer transition-all scribble-button shadow-sm"
              >
                Customer
              </button>
            </div>
          </div>
        </div>

        {/* Global Footer credits */}
        <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 pt-8 font-medium">
          &copy; 2026 AasaMedChem. Designed for Secure Chemistry Logistics.
        </div>
      </div>
    </div>
  );
}

