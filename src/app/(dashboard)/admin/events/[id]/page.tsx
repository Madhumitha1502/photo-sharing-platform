"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  CheckSquare,
  Square,
  Share2,
  Lock,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  MapPin,
  UploadCloud,
  CheckCircle2,
  Sparkles,
  RefreshCw,
} from "lucide-react";

interface EventDetail {
  id: string;
  title: string;
  description?: string;
  date?: string;
  location?: string;
  members: { user: { id: string; name: string; email: string } }[];
  gallery?: {
    id: string;
    slug: string;
    isPublished: boolean;
    publishedAt?: string;
  };
}

interface PhotoItem {
  id: string;
  filename: string;
  storageLocation: string;
  fileSize: number;
  isSelected: boolean;
  uploader: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface TeamMemberItem {
  id: string;
  name: string;
  email: string;
}

export default function AdminEventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & form state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);

  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [pin, setPin] = useState("482917");
  const [publishing, setPublishing] = useState(false);
  const [publishedData, setPublishedData] = useState<{ url: string; slug: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const fetchData = async () => {
    try {
      // 1. Fetch Event Details
      const eventRes = await fetch(`/api/events/${eventId}`);
      if (!eventRes.ok) {
        if (eventRes.status === 403) router.push("/team/events");
        return;
      }
      const eventData = await eventRes.json();
      setEvent(eventData.event);

      // 2. Fetch Photos
      const photosRes = await fetch(`/api/events/${eventId}/photos`);
      if (photosRes.ok) {
        const photosData = await photosRes.json();
        setPhotos(photosData.photos || []);
      }

      // 3. Fetch All Team Members for assignment
      const teamRes = await fetch("/api/admin/team");
      if (teamRes.ok) {
        const teamData = await teamRes.json();
        setTeamMembers(teamData.teamMembers || []);
      }
    } catch (err) {
      console.error("Failed to load event data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [eventId]);

  // Toggle selection for a single photo
  const togglePhotoSelection = async (photoId: string, currentSelection: boolean) => {
    const nextSelection = !currentSelection;

    // Optimistic UI update
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, isSelected: nextSelection } : p))
    );

    try {
      const res = await fetch(`/api/events/${eventId}/photos/selection`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoIds: [photoId],
          isSelected: nextSelection,
        }),
      });

      if (!res.ok) {
        // Rollback on error
        setPhotos((prev) =>
          prev.map((p) => (p.id === photoId ? { ...p, isSelected: currentSelection } : p))
        );
      }
    } catch (err) {
      console.error("Selection update failed:", err);
    }
  };

  // Bulk select / deselect
  const setBulkSelection = async (selectAll: boolean) => {
    const targetPhotos = photos.filter((p) => p.isSelected !== selectAll);
    if (targetPhotos.length === 0) return;

    const ids = targetPhotos.map((p) => p.id);

    // Optimistic update
    setPhotos((prev) => prev.map((p) => ({ ...p, isSelected: selectAll })));

    try {
      await fetch(`/api/events/${eventId}/photos/selection`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoIds: ids,
          isSelected: selectAll,
        }),
      });
    } catch (err) {
      console.error("Bulk update failed:", err);
      fetchData();
    }
  };

  // Handle Assigning Team Members
  const handleAssignMembers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMemberIds.length === 0) return;
    setAssigning(true);

    try {
      const res = await fetch(`/api/events/${eventId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedMemberIds }),
      });

      if (res.ok) {
        setIsAssignModalOpen(false);
        setSelectedMemberIds([]);
        fetchData();
      }
    } catch (err) {
      console.error("Assign error:", err);
    } finally {
      setAssigning(false);
    }
  };

  // Handle Publishing Gallery
  const handlePublishGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishing(true);
    setStatusMessage("");

    try {
      const res = await fetch(`/api/events/${eventId}/gallery/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatusMessage(data.error || "Failed to publish gallery");
        setPublishing(false);
        return;
      }

      setPublishedData({ url: data.gallery.url, slug: data.gallery.slug });
      fetchData();
    } catch (err) {
      setStatusMessage("An unexpected error occurred");
    } finally {
      setPublishing(false);
    }
  };

  const copyLink = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyPin = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const generateRandomPin = () => {
    const random = Math.floor(100000 + Math.random() * 900000).toString();
    setPin(random);
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm">Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p>Event not found.</p>
        <Link href="/admin/events" className="mt-4 text-indigo-400 inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Link>
      </div>
    );
  }

  const selectedCount = photos.filter((p) => p.isSelected).length;
  const isPublished = event.gallery?.isPublished;
  const galleryUrl = typeof window !== "undefined" && event.gallery
    ? `${window.location.origin}/gallery/${event.gallery.slug}`
    : `/gallery/${event.gallery?.slug || ""}`;

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <Link
            href="/admin/events"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Events
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {event.title}
            </h1>
            {isPublished && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                <CheckCircle2 className="w-3.5 h-3.5" /> Published
              </span>
            )}
          </div>
          {event.description && (
            <p className="text-sm text-slate-400">{event.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
            {event.date && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {new Date(event.date).toLocaleDateString()}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {event.location}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Users className="w-4 h-4" />
            Assign Team ({event.members.length})
          </button>

          <button
            onClick={() => {
              setPublishedData(null);
              setIsPublishModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition"
          >
            <Share2 className="w-4 h-4" />
            {isPublished ? "Manage Gallery & PIN" : "Publish Customer Gallery"}
          </button>
        </div>
      </div>

      {/* Published Gallery Quick Banner (if active) */}
      {isPublished && event.gallery && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/40 to-slate-900 border border-indigo-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                Live Customer Access Link
              </p>
              <p className="text-sm font-mono text-slate-200 truncate max-w-md">
                {galleryUrl}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => copyLink(galleryUrl)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied Link" : "Copy Link"}
            </button>
            <Link
              href={`/gallery/${event.gallery.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
            >
              Open Gallery <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Curation & Selection Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4 text-sm">
          <div>
            <span className="text-slate-400">Total Uploaded:</span>{" "}
            <span className="font-bold text-white">{photos.length}</span>
          </div>
          <div className="h-4 w-px bg-slate-800" />
          <div>
            <span className="text-slate-400">Selected for Gallery:</span>{" "}
            <span className="font-bold text-indigo-400">{selectedCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setBulkSelection(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
          >
            <CheckSquare className="w-3.5 h-3.5 text-indigo-400" /> Select All
          </button>
          <button
            onClick={() => setBulkSelection(false)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
          >
            <Square className="w-3.5 h-3.5 text-slate-400" /> Deselect All
          </button>
        </div>
      </div>

      {/* Photo Curation Grid */}
      {photos.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-2xl p-8">
          <UploadCloud className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No photos uploaded yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Team photographers assigned to this event will upload high-res photos here.
          </p>
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
          >
            <Users className="w-3.5 h-3.5" /> Assign Photographers
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => togglePhotoSelection(photo.id, photo.isSelected)}
              className={`relative rounded-xl overflow-hidden cursor-pointer group border-2 transition shadow-md bg-slate-900 ${
                photo.isSelected
                  ? "border-indigo-500 ring-2 ring-indigo-500/20"
                  : "border-slate-800/80 hover:border-slate-700"
              }`}
            >
              {/* Photo Image */}
              <div className="aspect-[4/3] w-full overflow-hidden bg-slate-950">
                <img
                  src={photo.storageLocation}
                  alt={photo.filename}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  loading="lazy"
                />
              </div>

              {/* Selection Badge Checkmark */}
              <div
                className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition shadow-lg ${
                  photo.isSelected
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-900/80 text-slate-400 opacity-70 group-hover:opacity-100"
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>

              {/* Caption Bar */}
              <div className="p-2.5 bg-slate-900/90 text-[11px] flex flex-col justify-between">
                <p className="text-white truncate font-medium">{photo.filename}</p>
                <div className="flex items-center justify-between text-slate-400 mt-1">
                  <span>{(photo.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
                  <span className="truncate max-w-[90px]">{photo.uploader?.name || "Team"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign Team Members Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Assign Photographers</h2>
            <p className="text-xs text-slate-400 mb-4">
              Select team members who can upload photos to this event.
            </p>

            <form onSubmit={handleAssignMembers} className="space-y-4">
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {teamMembers.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    No team members created yet. Visit the Team Members page to create one.
                  </p>
                ) : (
                  teamMembers.map((member) => {
                    const isAlreadyAssigned = event.members.some(
                      (m) => m.user.id === member.id
                    );
                    const isChecked =
                      selectedMemberIds.includes(member.id) || isAlreadyAssigned;

                    return (
                      <label
                        key={member.id}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition ${
                          isChecked
                            ? "bg-indigo-950/40 border-indigo-800/60 text-white"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900"
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-white">{member.name}</p>
                          <p className="text-[11px] text-slate-400">{member.email}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isAlreadyAssigned}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMemberIds([...selectedMemberIds, member.id]);
                            } else {
                              setSelectedMemberIds(
                                selectedMemberIds.filter((id) => id !== member.id)
                              );
                            }
                          }}
                          className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                        />
                      </label>
                    );
                  })
                )}
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={assigning || selectedMemberIds.length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
                >
                  {assigning ? "Saving..." : "Save Assignments"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Publish Gallery & PIN Modal */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Publish Customer Gallery</h2>
                <p className="text-xs text-slate-400">
                  Generate a shareable link and secure access PIN for the client.
                </p>
              </div>
            </div>

            {statusMessage && (
              <div className="my-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {statusMessage}
              </div>
            )}

            {publishedData ? (
              <div className="my-6 space-y-4">
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs">
                  🎉 Gallery published successfully! Only clients with the PIN can access these curated photos.
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Shareable Gallery URL:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={publishedData.url}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs"
                    />
                    <button
                      onClick={() => copyLink(publishedData.url)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Access PIN:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={pin}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-indigo-400 font-mono font-bold text-sm tracking-widest"
                    />
                    <button
                      onClick={() => copyPin(pin)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setIsPublishModalOpen(false)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePublishGallery} className="space-y-4 mt-6">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                  <span className="font-semibold text-white">Photos Selected:</span>{" "}
                  <span className="text-indigo-400 font-bold">{selectedCount}</span> of {photos.length}
                  {selectedCount === 0 && (
                    <p className="text-rose-400 mt-1">
                      ⚠️ Please select at least one photo before publishing the gallery.
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-300">
                      Gallery Access PIN (4-10 digits) *
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPin}
                      className="text-indigo-400 hover:text-indigo-300 text-xs inline-flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Auto-Generate
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      pattern="[0-9]{4,10}"
                      placeholder="e.g. 482917"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ""))}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-sm tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    The PIN will be hashed with bcrypt in the database. Plaintext PIN is never stored.
                  </p>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPublishModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={publishing || selectedCount === 0}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {publishing ? "Publishing..." : "Confirm & Publish Gallery"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
