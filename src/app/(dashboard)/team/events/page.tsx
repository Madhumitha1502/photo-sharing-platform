"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, MapPin, UploadCloud, ArrowRight, ShieldAlert } from "lucide-react";

interface AssignedEvent {
  id: string;
  title: string;
  description?: string;
  date?: string;
  location?: string;
  admin: {
    name: string;
    email: string;
  };
  _count: {
    photos: number;
  };
}

export default function TeamEventsPage() {
  const [events, setEvents] = useState<AssignedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssignedEvents() {
      try {
        const res = await fetch("/api/events");
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events || []);
        }
      } catch (err) {
        console.error("Failed to load assigned events:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAssignedEvents();
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="pb-8 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            Photographer Workspace
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          My Assigned Events
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Upload event photos for Admin review and customer gallery selection.
        </p>
      </div>

      {/* Info Notice about Role Permissions */}
      <div className="mt-6 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
        <p>
          <strong className="text-white">Role Privileges:</strong> As a Team Member, you can upload multiple photos to events you are assigned to. Gallery curation, customer PIN creation, and publishing are managed strictly by the Lead Admin.
        </p>
      </div>

      {/* Events List */}
      <div className="mt-8">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <div className="inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Loading assigned events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl p-8">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-1">No assigned events</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              You have not been assigned to any events yet. Your Lead Admin will add you to upcoming shoots.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition shadow-lg group"
              >
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition">
                    {ev.title}
                  </h3>
                  {ev.description && (
                    <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                      {ev.description}
                    </p>
                  )}

                  <div className="mt-4 space-y-1.5 text-xs text-slate-400">
                    {ev.date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(ev.date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {ev.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>{ev.location}</span>
                      </div>
                    )}
                    <div className="text-[11px] text-slate-500 mt-2">
                      Lead Admin: <span className="text-slate-400">{ev.admin.name}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80">
                  <Link
                    href={`/team/events/${ev.id}`}
                    className="w-full py-2.5 px-3 flex items-center justify-center gap-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition"
                  >
                    <UploadCloud className="w-4 h-4" /> Upload Photos
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
