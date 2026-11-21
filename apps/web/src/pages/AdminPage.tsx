import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { ComplaintDto, ComplaintPriority } from "@civicresolve/shared";
import { TriageQueue } from "../features/admin/TriageQueue";
import { CivicHeatmap } from "../features/map/CivicHeatmap";
import { DepartmentSlaSettings } from "../features/admin/DepartmentSlaSettings";
import { VerifyResolutionModal } from "../features/admin/VerifyResolutionModal";
import { AccessibleModal } from "../components/AccessibleModal";
import { StatusTimeline } from "../features/tracker/StatusTimeline";
import { ScoreBreakdownCard } from "../features/tracker/ScoreBreakdownCard";
import { SLACountdownCard } from "../features/tracker/SLACountdownCard";
import { LayoutDashboard, RefreshCw } from "lucide-react";

export const AdminPage: React.FC = () => {
  const [tab, setTab] = useState<"queue" | "map" | "sla">("queue");
  const [complaints, setComplaints] = useState<ComplaintDto[]>([]);
  const [heatmapPoints, setHeatmapPoints] = useState<
    Array<{
      id: string;
      trackingCode: string;
      title: string;
      category: string;
      priority: ComplaintPriority;
      status: string;
      impactScore: number;
      lat: number;
      lng: number;
      address?: string | null;
      createdAt: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  // Selected for Details
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintDto | null>(null);

  // Selected for Resolution
  const [resolveComplaint, setResolveComplaint] = useState<ComplaintDto | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [listRes, pointsRes] = await Promise.all([
        api.listComplaints({ limit: 100 }),
        api.getHeatmapPoints(),
      ]);
      setComplaints(listRes.items || []);
      setHeatmapPoints(pointsRes || []);
    } catch (_err) {
      // Handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <main id="main-content" className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-primary-600" />
            <span>Municipal Command Center</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Coimbatore City Administration: Triage, AI Resolution Verification & Spatial Analytics
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="min-h-touch px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-4">
        <button
          type="button"
          onClick={() => setTab("queue")}
          className={`min-h-touch pb-3 text-sm font-semibold border-b-2 transition ${
            tab === "queue"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Triage Queue ({complaints.length})
        </button>

        <button
          type="button"
          onClick={() => setTab("map")}
          className={`min-h-touch pb-3 text-sm font-semibold border-b-2 transition ${
            tab === "map"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Spatial Heatmap
        </button>

        <button
          type="button"
          onClick={() => setTab("sla")}
          className={`min-h-touch pb-3 text-sm font-semibold border-b-2 transition ${
            tab === "sla"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Department SLAs
        </button>
      </div>

      {/* Tab Content */}
      {tab === "queue" && (
        <TriageQueue
          complaints={complaints}
          onSelectComplaint={(c) => setSelectedComplaint(c)}
          onOpenResolve={(c) => setResolveComplaint(c)}
          loading={loading}
        />
      )}

      {tab === "map" && <CivicHeatmap points={heatmapPoints} />}

      {tab === "sla" && <DepartmentSlaSettings />}

      {/* Details Modal */}
      {selectedComplaint && (
        <AccessibleModal
          isOpen={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          title={`Grievance: ${selectedComplaint.trackingCode}`}
          description={selectedComplaint.title}
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {selectedComplaint.description}
            </p>

            <SLACountdownCard
              slaDueAt={selectedComplaint.slaDueAt}
              slaHours={selectedComplaint.department?.slaHours}
              departmentName={selectedComplaint.department?.name}
              isEscalated={selectedComplaint.isEscalated}
            />

            <ScoreBreakdownCard
              score={selectedComplaint.impactScore}
              breakdown={selectedComplaint.scoreBreakdown}
              aiReasoning={selectedComplaint.aiReasoning}
              aiSource={selectedComplaint.aiSource}
            />

            {selectedComplaint.statusEvents && (
              <StatusTimeline
                events={selectedComplaint.statusEvents}
                currentStatus={selectedComplaint.status}
              />
            )}
          </div>
        </AccessibleModal>
      )}

      {/* Verification & Resolution Modal */}
      {resolveComplaint && (
        <VerifyResolutionModal
          isOpen={!!resolveComplaint}
          onClose={() => setResolveComplaint(null)}
          complaintId={resolveComplaint.id}
          trackingCode={resolveComplaint.trackingCode}
          category={resolveComplaint.category}
          beforeImageUrl={resolveComplaint.imageUrl}
          onResolved={() => {
            setResolveComplaint(null);
            loadData();
          }}
        />
      )}
    </main>
  );
};
