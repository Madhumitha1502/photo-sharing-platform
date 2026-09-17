"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Camera, Shield, Users, LogOut, Calendar, Layers } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "TEAM_MEMBER";
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        setUser(data.user);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading workspace...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isAdmin = user.role === "ADMIN";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link
              href={isAdmin ? "/admin/events" : "/team/events"}
              className="flex items-center space-x-2.5"
            >
              <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-600/30">
                <Camera className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                PhotoStream Pro
              </span>
            </Link>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center space-x-1">
              {isAdmin ? (
                <>
                  <Link
                    href="/admin/events"
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                      pathname.startsWith("/admin/events")
                        ? "bg-slate-800 text-white shadow"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    Events & Galleries
                  </Link>
                  <Link
                    href="/admin/team"
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                      pathname.startsWith("/admin/team")
                        ? "bg-slate-800 text-white shadow"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Team Members
                  </Link>
                </>
              ) : (
                <Link
                  href="/team/events"
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                    pathname.startsWith("/team/events")
                      ? "bg-slate-800 text-white shadow"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Assigned Events
                </Link>
              )}
            </nav>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2.5">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-white">{user.name}</p>
                <p className="text-[11px] text-slate-400">{user.email}</p>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                  isAdmin
                    ? "bg-indigo-950/80 text-indigo-400 border-indigo-800/60"
                    : "bg-emerald-950/80 text-emerald-400 border-emerald-800/60"
                }`}
              >
                {isAdmin ? (
                  <>
                    <Shield className="w-3 h-3" /> Admin
                  </>
                ) : (
                  <>
                    <Users className="w-3 h-3" /> Team
                  </>
                )}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
