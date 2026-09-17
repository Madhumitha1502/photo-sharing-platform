"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  ShieldAlert,
  Calendar,
  MapPin,
} from "lucide-react";

interface EventInfo {
  id: string;
  title: string;
  description?: string;
  date?: string;
  location?: string;
}

interface PhotoItem {
  id: string;
  filename: string;
  storageLocation: string;
  fileSize: number;
  createdAt: string;
}

export default function TeamEventUploadPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventInfo | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);

  // File upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{
    success?: string;
    error?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchEventData = async () => {
    try {
      // 1. Fetch Event
      const res = await fetch(`/api/events/${eventId}`);
      if (!res.ok) {
        if (res.status === 403) router.push("/team/events");
        return;
      }
      const data = await res.json();
      setEvent(data.event);

      // 2. Fetch Photos uploaded by me for this event
      const photosRes = await fetch(`/api/events/${eventId}/photos?mine=true`);
      if (photosRes.ok) {
        const photosData = await photosRes.json();
        setPhotos(photosData.photos || []);
      }
    } catch (err) {
      console.error("Failed to load event:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter((file) =>
        file.type.startsWith("image/")
      );
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadStatus(null);
    setUploadProgress(10);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("photos", file);
    });

    try {
      setUploadProgress(40);
      const res = await fetch(`/api/events/${eventId}/photos`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setUploadProgress(100);

      if (!res.ok) {
        setUploadStatus({ error: data.error || "Upload failed" });
      } else {
        setUploadStatus({
          success: `Successfully uploaded ${data.uploadedCount} photo(s) to cloud storage!`,
        });
        setSelectedFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchEventData();
      }
    } catch (err) {
      setUploadStatus({ error: "A network error occurred during upload" });
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(null), 1500);
    }
  };

  // Test Team Member Publish Restriction (should return 403)
  const testPublishBlock = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/gallery/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: "123456" }),
      });
      const data = await res.json();
      if (res.status === 403) {
        alert("Verification Success: Team Members are strictly blocked from publishing galleries (403 Forbidden).");
      } else {
        alert(`Unexpected response: ${res.status}`);
      }
    } catch {
      alert("Request failed");
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm">Loading event upload portal...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p>Event not found or you are not assigned to it.</p>
        <Link href="/team/events" className="mt-4 text-emerald-400 inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to My Events
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <Link
            href="/team/events"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to My Events
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {event.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              Photographer Upload Portal
            </span>
          </div>
          {event.description && (
            <p className="text-sm text-slate-400 mt-1">{event.description}</p>
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

        {/* Security Rule Demonstration Button */}
        <div>
          <button
            onClick={testPublishBlock}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            title="Test PDF Section 2.2 Security Restriction"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Test 403 Publish Restriction
          </button>
        </div>
      </div>

      {/* Upload Zone Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-emerald-400" /> Batch Photo Upload
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Select multiple photographs from your shoot to upload to cloud storage.
        </p>

        {uploadStatus?.success && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{uploadStatus.success}</span>
          </div>
        )}

        {uploadStatus?.error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{uploadStatus.error}</span>
          </div>
        )}

        {uploadProgress !== null && (
          <div className="mb-6 space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Uploading to cloud storage...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <form onSubmit={handleUploadSubmit} className="space-y-4">
          {/* Dropzone area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-emerald-500/70 rounded-2xl p-8 text-center cursor-pointer bg-slate-950/60 hover:bg-slate-950 transition group"
          >
            <UploadCloud className="w-10 h-10 text-slate-500 group-hover:text-emerald-400 mx-auto mb-2 transition" />
            <p className="text-sm font-semibold text-white">
              Click to select photos or drag and drop
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports multiple files (JPEG, PNG, WebP)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Staged files preview list */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>{selectedFiles.length} photo(s) selected for upload:</span>
                <button
                  type="button"
                  onClick={() => setSelectedFiles([])}
                  className="text-rose-400 hover:underline"
                >
                  Clear all
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <ImageIcon className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="text-white truncate">{file.name}</span>
                      <span className="text-slate-500 text-[10px]">
                        ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <UploadCloud className="w-4 h-4" />
                {uploading ? "Uploading to Cloud Storage..." : `Upload ${selectedFiles.length} Photo(s)`}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Uploaded Photos by this Team Member */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">
            My Uploaded Photos ({photos.length})
          </h2>
          <span className="text-xs text-slate-400">
            Photos are reviewed by the Lead Admin for final gallery curation.
          </span>
        </div>

        {photos.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-slate-500 text-xs">
            You have not uploaded any photos to this event yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-md group"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-slate-950">
                  <img
                    src={photo.storageLocation}
                    alt={photo.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="p-2.5 text-[11px]">
                  <p className="text-white truncate font-medium">{photo.filename}</p>
                  <p className="text-slate-500 text-[10px] mt-0.5">
                    {(photo.fileSize / (1024 * 1024)).toFixed(1)} MB • {new Date(photo.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
