"use client";

import React, { useState, useEffect } from "react";
import { Sun, Moon, Bell, Search, Menu, Command, ChevronDown, User, ShieldAlert, ShoppingBag, ShieldCheck, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logoutUser } from "@/lib/actions/auth";
import { getNotificationsList, markNotificationReadAction, markAllNotificationsReadAction } from "@/lib/actions/quotationActions";
import CommandMenu from "./CommandMenu";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Database-backed states
  const [dbUser, setDbUser] = useState<any>(null);
  const [dbNotifications, setDbNotifications] = useState<any[]>([]);

  // Load session on mount
  useEffect(() => {
    async function loadSession() {
      const user = await getCurrentUser();
      setDbUser(user);
      if (user) {
        const notifs = await getNotificationsList();
        setDbNotifications(notifs);
      }
    }
    loadSession();
  }, []);

  // Sync theme to document class
  useEffect(() => {
    const localTheme = localStorage.getItem("aasamedchem-theme") || "dark";
    setTheme(localTheme as "light" | "dark");
    if (localTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("aasamedchem-theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Keyboard shortcut Ctrl/Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const unreadNotifications = dbNotifications.filter((n) => !n.isRead);

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await logoutUser();
    router.push("/login");
    router.refresh();
  };

  const handleMarkRead = async (id: number) => {
    await markNotificationReadAction(id);
    const updated = await getNotificationsList();
    setDbNotifications(updated);
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsReadAction();
    const updated = await getNotificationsList();
    setDbNotifications(updated);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-card border-b-2 border-slate-900 dark:border-slate-200 px-4 lg:px-6 h-16 flex items-center justify-between font-scribble">
        {/* Left Side Brand / Menu Toggle */}
        <div className="flex items-center gap-4">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors lg:hidden border-2 border-transparent hover:border-slate-900 dark:hover:border-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          
          <div className="flex items-center gap-2 cursor-pointer font-bold" onClick={() => router.push("/")}>
            <div className="w-8 h-8 scribble-border bg-violet-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm tracking-tighter">AM</span>
            </div>
            <span className="font-extrabold text-lg text-slate-900 dark:text-white">
              AasaMedChem
            </span>
          </div>
        </div>

        {/* Global Search Bar Trigger */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <button
            onClick={() => setIsCommandOpen(true)}
            className="w-full flex items-center justify-between px-3 py-1.5 scribble-border bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 hover:text-slate-650 transition-all text-xs group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-500 transition-colors" />
              <span>Search chemicals and commands...</span>
            </div>
            <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono">
              <Command className="w-2.5 h-2.5" />
              <span>K</span>
            </div>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Search Button */}
          <button
            onClick={() => setIsCommandOpen(true)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors md:hidden"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>

          {/* Notification Droplist */}
          {dbUser && (
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet-600 ring-2 ring-white dark:ring-slate-950 animate-pulse" />
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-semibold text-sm">Notifications</span>
                    {unreadNotifications.length > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto px-1 py-1">
                    {dbNotifications.length > 0 ? (
                      dbNotifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleMarkRead(n.id)}
                          className={`p-2.5 my-0.5 rounded-lg text-xs cursor-pointer transition-colors ${
                            n.isRead
                              ? "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                              : "bg-violet-50/50 dark:bg-violet-950/20 text-slate-800 dark:text-slate-200 hover:bg-violet-50 dark:hover:bg-violet-950/30 font-medium"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="flex-1 leading-normal">{n.message}</p>
                            {!n.isRead && <span className="w-1.5 h-1.5 bg-violet-600 rounded-full mt-1 flex-shrink-0" />}
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-1.5">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-xs text-slate-400 py-6">No notifications found.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Profile Simulated Avatar & Selector */}
          {dbUser ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-sm">
                  {dbUser.name.charAt(0)}
                </div>
                <ChevronDown className="w-4 h-4 text-slate-500 hidden sm:block" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{dbUser.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {dbUser.role === "admin" && <ShieldCheck className="w-3.5 h-3.5 text-violet-500" />}
                      {dbUser.role === "seller" && <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />}
                      {dbUser.role === "customer" && <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />}
                      <span className="text-xs text-slate-400 capitalize">{dbUser.role}</span>
                    </div>
                  </div>

                  <div className="p-1.5">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        router.push("/profile");
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                    >
                      <User className="w-4 h-4" />
                      <span>View Profile</span>
                    </button>
                    
                    <div className="border-t border-slate-100 dark:border-slate-800 my-1.5" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-955/20 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out Session</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
             <button
               onClick={() => router.push("/login")}
               className="flex items-center gap-2 px-4 py-1.5 text-sm font-black text-slate-950 bg-violet-600 hover:bg-violet-700 rounded-lg shadow-sm shadow-violet-500/10 scribble-button cursor-pointer"
             >
               <User className="w-4 h-4 text-slate-950" />
               <span>Log In</span>
             </button>
          )}
        </div>
      </header>

      {/* Global Command Menu Dialog */}
      <CommandMenu isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </>
  );
}

