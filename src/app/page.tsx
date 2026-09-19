import Link from "next/link";
import { Camera, Shield, Users, Sparkles, KeyRound, ExternalLink, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              PhotoStream Pro
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-md shadow-indigo-600/20 transition-all hover:shadow-indigo-600/30"
            >
              Admin Register
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6">
          <Camera className="w-3.5 h-3.5" /> PHOTO SHARING PLATFORM
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Capture. Curate. Share. <br />
<span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
  Private Event Galleries Made Simple
</span>
          </h1>
          <p className="mt-6 text-lg text-slate-400 leading-relaxed">
            A collaborative photo platform for event teams to upload, organize, curate, and securely share memories with clients.
          </p>

          {/* Quick Demo Access Bar */}
          <div className="mt-10 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
              Explore the Platform
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              {/* Admin Card */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/50">
                      Admin Portal
                    </span>
                    <Shield className="w-4 h-4 text-indigo-400" />
                  </div>
                  <p className="text-xs text-slate-400 font-mono">admin@trizen.com</p>
                  <p className="text-xs text-slate-500 font-mono">AdminPassword123!</p>
                  <p className="text-xs text-slate-400 mt-2">
                   Manage events, team members, photo collections and client galleries.
                  </p>
                </div>
                <Link
                  href="/login?demo=admin"
                  className="mt-4 inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
                >
                  Admin Portal <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Team Member Card */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                     photographer
                    </span>
                    <Users className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xs text-slate-400 font-mono">photographer@trizen.com</p>
                  <p className="text-xs text-slate-500 font-mono">TeamPassword123!</p>
                  <p className="text-xs text-slate-400 mt-2">
                    Upload and manage photos for assigned events.
                  </p>
                </div>
                <Link
                  href="/login?demo=team"
                  className="mt-4 inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
                >
                  Photographer Portal <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Client Gallery Card */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-pink-400 bg-pink-950/60 px-2 py-0.5 rounded border border-pink-800/50">
                      Client Gallery
                    </span>
                    <KeyRound className="w-4 h-4 text-pink-400" />
                  </div>
                  <p className="text-xs text-slate-300 font-semibold">Arjun & Priya Wedding</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Gallery PIN: <span className="font-mono text-pink-400 font-bold">482917</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                   Access a private event gallery securely using a PIN — no account required.
                  </p>
                </div>
                <Link
                  href="/gallery/abc123"
                  className="mt-4 inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 text-xs font-semibold bg-pink-600 hover:bg-pink-500 text-white rounded-lg transition"
                >
                  Open Live Gallery <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Cloud Object Storage</h3>
            <p className="text-sm text-slate-400">
              High-resolution photos are securely stored in cloud object storage with optimized CDN delivery. Image files are never stored directly in the database.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Strict Role-Based Security</h3>
            <p className="text-sm text-slate-400">
              Role-based access ensures administrators and photographers only access the features and events they are authorized to manage.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-4">
              <KeyRound className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">PIN-Protected Galleries</h3>
            <p className="text-sm text-slate-400">
              Clients can securely unlock their private galleries using a unique PIN. Access is protected with secure PIN storage and rate limiting.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        TrizenAI Technologies — MADHUMITHA V
      </footer>
    </div>
  );
}
