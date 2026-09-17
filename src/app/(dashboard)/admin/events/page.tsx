"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Calendar, MapPin, Users, Image as ImageIcon, ExternalLink, Sparkles, CheckCircle2 } from "lucide-react";

interface EventItem {
  id: string;
  title: string;
  description?: string;
  date?: string;
  location?: string;
  _count: {
    photos: number;
    members: number;
  };
  selectedPhotosCount: number;
  gallery?: {
    id: string;
    slug: string;
    isPublished: boolean;
    publishedAt?: string;
  };
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error("Failed to load events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create event");
        setCreating(false);
        return;
      }

      setFormData({ title: "", description: "", date: "", location: "" });
      setIsModalOpen(false);
      fetchEvents();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Events & Gallery Management
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Create events, assign photographers, curate photos, and publish PIN-protected customer galleries.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </button>
      </div>

      {/* Events Grid */}
      <div className="mt-8">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl p-8">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-1">No events yet</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">
              Create your first photography event to start assigning team members and uploading photos.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow transition"
            >
              <Plus className="w-4 h-4" /> Create Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev) => {
              const isPublished = ev.gallery?.isPublished;
              return (
                <div
                  key={ev.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition shadow-lg group"
                >
                  <div>
                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-3">
                      {isPublished ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Published Gallery
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-800/60">
                          Draft / Unshared
                        </span>
                      )}

                      {isPublished && ev.gallery && (
                        <Link
                          href={`/gallery/${ev.gallery.slug}`}
                          target="_blank"
                          className="text-xs text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 font-medium"
                        >
                          Customer Link <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition">
                      {ev.title}
                    </h3>
                    {ev.description && (
                      <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                        {ev.description}
                      </p>
                    )}

                    {/* Metadata items */}
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
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>{ev._count.members} Assigned Photographer(s)</span>
                      </div>
                    </div>

                    {/* Photo Stats Counter */}
                    <div className="mt-5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400">Uploaded:</span>{" "}
                        <span className="font-semibold text-white">{ev._count.photos}</span>
                      </div>
                      <div className="h-4 w-px bg-slate-800" />
                      <div>
                        <span className="text-slate-400">Selected:</span>{" "}
                        <span className="font-semibold text-indigo-400">
                          {ev.selectedPhotosCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                    <Link
                      href={`/admin/events/${ev.id}`}
                      className="w-full py-2 px-3 text-center text-xs font-semibold rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition"
                    >
                      Manage & Curate Photos
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-1">Create New Event</h2>
            <p className="text-xs text-slate-400 mb-6">
              Initialize a photography project for collaborative uploads and gallery sharing.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arjun & Priya Wedding"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Ceremony and reception shoot details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="Bangalore"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
