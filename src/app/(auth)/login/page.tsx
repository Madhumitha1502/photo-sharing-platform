"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Camera, Lock, Mail, ArrowRight, Shield, Users } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const demo = searchParams.get("demo");
    if (demo === "admin") {
      setEmail("admin@trizen.com");
      setPassword("AdminPassword123!");
    } else if (demo === "team") {
      setEmail("photographer@trizen.com");
      setPassword("TeamPassword123!");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      // Redirect based on role
      if (data.user.role === "ADMIN") {
        router.push("/admin/events");
      } else {
        router.push("/team/events");
      }
      router.refresh();
    } catch (err: any) {
      setError("An unexpected network error occurred");
      setLoading(false);
    }
  };

  const fillAdmin = () => {
    setEmail("admin@trizen.com");
    setPassword("AdminPassword123!");
  };

  const fillTeam = () => {
    setEmail("photographer@trizen.com");
    setPassword("TeamPassword123!");
  };

  return (
    <div className="bg-slate-900 border border-slate-800 py-8 px-6 sm:px-10 rounded-2xl shadow-xl">
      {/* Demo autofill buttons */}
      <div className="mb-6 pb-6 border-b border-slate-800">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
          Quick Test Autofill
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={fillAdmin}
            className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg bg-indigo-950/70 border border-indigo-800/60 text-indigo-300 hover:bg-indigo-900 transition"
          >
            <Shield className="w-3.5 h-3.5" /> Lead Admin
          </button>
          <button
            type="button"
            onClick={fillTeam}
            className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 hover:bg-emerald-900 transition"
          >
            <Users className="w-3.5 h-3.5" /> Team Member
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@trizen.com"
              className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-400">
        Need an Admin account?{" "}
        <Link href="/register" className="text-indigo-400 hover:underline font-semibold">
          Register here
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center space-x-2 text-white">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-600/30">
            <Camera className="w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-tight">PhotoStream Pro</span>
        </Link>
        <h2 className="mt-6 text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Sign in to your account
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Admin and Team Member authenticated workspace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Suspense
          fallback={
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center text-slate-400 text-sm">
              Loading form...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
