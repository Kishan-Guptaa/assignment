import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import Header from "@/components/Header";
import { User } from "lucide-react";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-scribble">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-24 sm:py-32">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Account Profile
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Manage your personal information and preferences.
            </p>
          </div>
          <div className="p-3 bg-violet-100 dark:bg-violet-950/40 rounded-2xl">
            <User className="w-8 h-8 text-violet-600 dark:text-violet-400" />
          </div>
        </div>

        <ProfileClient user={user} />
      </main>
    </div>
  );
}
