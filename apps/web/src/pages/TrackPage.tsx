import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { ComplaintDto } from "@civicresolve/shared";
import { StatusBadge, PriorityBadge } from "../components/Badge";
import { ScoreBreakdownCard } from "../features/tracker/ScoreBreakdownCard";
import { StatusTimeline } from "../features/tracker/StatusTimeline";
import { SLACountdownCard } from "../features/tracker/SLACountdownCard";
import { Search, Loader2, Users, CheckCircle2, RotateCcw } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export const TrackPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCode = searchParams.get("code") || "";
  const [trackingCode, setTrackingCode] = useState(initialCode);
  const [complaint, setComplaint] = useState<ComplaintDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supporting, setSupporting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [reopenMode, setReopenMode] = useState(false);
  const [reopenRemarks, setReopenRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const { user } = useAuth();

  const fetchComplaint = async (code: string) => {
    if (!code.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getComplaintByCode(code.trim());
      setComplaint(data);
      setSearchParams({ code: code.trim() });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Complaint not found");
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      fetchComplaint(initialCode);
    }
  }, [initialCode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchComplaint(trackingCode);
  };

  const handleSupport = async () => {
    if (!complaint || !user) {
      setActionMessage({
        text: "Please sign in to support this grievance",
        type: "error",
      });
      return;
    }
    try {
      setSupporting(true);
      setActionMessage(null);
      await api.supportComplaint(complaint.id);
      setActionMessage({
        text: "Thank you for supporting this grievance! Impact score updated.",
        type: "success",
      });
      fetchComplaint(complaint.trackingCode);
    } catch (err: unknown) {
      setActionMessage({
        text: err instanceof Error ? err.message : "Failed to support grievance",
        type: "error",
      });
    } finally {
      setSupporting(false);
    }
  };

  const handleConfirmResolution = async () => {
    if (!complaint) return;
    try {
      setActionLoading(true);
      setActionMessage(null);
      await api.confirmComplaint(complaint.id);
      setActionMessage({
        text: "Resolution confirmed! Thank you for validating the municipal repair.",
        type: "success",
      });
      fetchComplaint(complaint.trackingCode);
    } catch (err: unknown) {
      setActionMessage({
        text: err instanceof Error ? err.message : "Failed to confirm resolution",
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopen = async () => {
    if (!complaint) return;
    try {
      setActionLoading(true);
      setActionMessage(null);
      await api.reopenComplaint(complaint.id, reopenRemarks);
      setActionMessage({
        text: "Grievance has been reopened and escalated for municipal re-inspection.",
        type: "success",
      });
      setReopenMode(false);
      setReopenRemarks("");
      fetchComplaint(complaint.trackingCode);
    } catch (err: unknown) {
      setActionMessage({
        text: err instanceof Error ? err.message : "Failed to reopen grievance",
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <main id="main-content" className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Search Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Public Grievance Tracker
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Track real-time progress, SLA deadline countdown, and Gemini verification status
        </p>

        <form onSubmit={handleSearch} className="max-w-md mx-auto mt-6 flex gap-2">
          <input
            id="tracking-search-input"
            type="text"
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value)}
            placeholder="Enter Tracking Code (e.g. CR-2024-1001)"
            className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white uppercase font-mono font-semibold focus:ring-2 focus:ring-primary-500 focus:outline-none"
            aria-label="Tracking code"
            aria-invalid={!!error}
            aria-describedby={error ? "track-search-error" : undefined}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="min-h-touch px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>Track</span>
          </button>
        </form>

        {error && (
          <div
            id="track-search-error"
            role="alert"
            aria-live="assertive"
            className="mt-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-700 dark:text-red-300 rounded text-xs"
          >
            {error}
          </div>
        )}
      </div>

      {/* Complaint Detail View */}
      {actionMessage && (
        <div
          role={actionMessage.type === "error" ? "alert" : "status"}
          aria-live="polite"
          className={`p-4 rounded-xl border text-xs sm:text-sm font-medium ${
            actionMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
              : "bg-red-50 dark:bg-red-950/50 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200"
          }`}
        >
          {actionMessage.text}
        </div>
      )}

      {complaint && (
        <div className="space-y-6">
          {/* Main Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-black text-primary-600">
                    {complaint.trackingCode}
                  </span>
                  <StatusBadge status={complaint.status} isEscalated={complaint.isEscalated} />
                  <PriorityBadge priority={complaint.priority} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {complaint.title}
                </h2>
              </div>

              {/* Citizen Support Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSupport}
                  disabled={supporting}
                  className="min-h-touch px-4 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition shadow-xs"
                >
                  <Users className="w-4 h-4" />
                  <span>Support ({complaint.supportCount})</span>
                </button>
              </div>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {complaint.description}
            </p>

            {complaint.address && (
              <div className="text-xs text-slate-500">
                <strong>Location:</strong> {complaint.address} ({complaint.lat.toFixed(4)},{" "}
                {complaint.lng.toFixed(4)})
              </div>
            )}

            {/* Photo previews: Before and After (if resolved) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {complaint.imageUrl && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Reported Issue Photo
                  </span>
                  <img
                    src={complaint.imageUrl}
                    alt="Reported civic defect"
                    className="w-full h-48 object-cover rounded-md"
                  />
                </div>
              )}

              {complaint.afterImageUrl && (
                <div className="border border-emerald-200 dark:border-emerald-900/50 rounded-lg p-2 bg-emerald-50/40 dark:bg-emerald-950/20">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                    Resolution Proof Photo (Gemini Verified)
                  </span>
                  <img
                    src={complaint.afterImageUrl}
                    alt="Resolved condition"
                    className="w-full h-48 object-cover rounded-md"
                  />
                  {complaint.verificationResult && (
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-2 font-medium">
                      ✓ {complaint.verificationResult.reason}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Citizen Resolution Verification Actions */}
          {complaint.status === "RESOLVED" && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-emerald-300 dark:border-emerald-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-semibold">Citizen Resolution Verification</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Municipal authorities have submitted repair proof and marked this grievance as
                resolved. Please inspect the work. You can confirm the resolution or reopen the
                ticket if the problem persists.
              </p>

              {reopenMode ? (
                <div className="space-y-3 pt-2">
                  <label
                    htmlFor="reopen-remarks"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Reason for reopening:
                  </label>
                  <textarea
                    id="reopen-remarks"
                    rows={3}
                    value={reopenRemarks}
                    onChange={(e) => setReopenRemarks(e.target.value)}
                    placeholder="Describe why the issue is not adequately resolved..."
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm focus:ring-2 focus:ring-primary-500"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleReopen}
                      disabled={actionLoading}
                      className="min-h-touch px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold"
                    >
                      Submit Reopen Request
                    </button>
                    <button
                      type="button"
                      onClick={() => setReopenMode(false)}
                      className="min-h-touch px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleConfirmResolution}
                    disabled={actionLoading}
                    className="min-h-touch px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Resolution</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReopenMode(true)}
                    disabled={actionLoading}
                    className="min-h-touch px-5 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-50 font-bold text-xs flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reopen Grievance</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SLA Countdown Card */}
          <SLACountdownCard
            slaDueAt={complaint.slaDueAt}
            slaHours={complaint.department?.slaHours}
            departmentName={complaint.department?.name}
            isEscalated={complaint.isEscalated}
          />

          {/* Explainable Impact Score Card */}
          <ScoreBreakdownCard
            score={complaint.impactScore}
            breakdown={complaint.scoreBreakdown}
            aiReasoning={complaint.aiReasoning}
            aiSource={complaint.aiSource}
          />

          {/* Official Timeline */}
          {complaint.statusEvents && (
            <StatusTimeline events={complaint.statusEvents} currentStatus={complaint.status} />
          )}
        </div>
      )}
    </main>
  );
};
