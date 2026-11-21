import React, { useState } from "react";
import { ComplaintDto } from "@civicresolve/shared";
import { StatusBadge, PriorityBadge } from "../../components/Badge";
import { formatTimeRemaining, getScoreColor } from "../../lib/utils";
import { Search, CheckCircle2, Eye } from "lucide-react";

interface TriageQueueProps {
  complaints: ComplaintDto[];
  onSelectComplaint: (c: ComplaintDto) => void;
  onOpenResolve: (c: ComplaintDto) => void;
  loading?: boolean;
}

export const TriageQueue: React.FC<TriageQueueProps> = ({
  complaints,
  onSelectComplaint,
  onOpenResolve,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Filter complaints
  const filtered = complaints.filter((c) => {
    const matchesSearch =
      c.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === "ALL" || c.category === categoryFilter;
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Sort complaints: Escalated first, then highest impact score, then newest
  const sorted = [...filtered].sort((a, b) => {
    if (a.isEscalated && !b.isEscalated) return -1;
    if (!a.isEscalated && b.isEscalated) return 1;
    if (b.impactScore !== a.impactScore) return b.impactScore - a.impactScore;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-4">
      {/* Search and Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by code, title, or Coimbatore area..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
            aria-label="Search grievances"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
            className="text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg py-2 px-3 text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">All Categories</option>
            <option value="POTHOLE">Potholes</option>
            <option value="GARBAGE">Garbage</option>
            <option value="STREETLIGHT">Streetlights</option>
            <option value="WATER_LEAKAGE">Water Leakage</option>
            <option value="BAD_ROAD">Bad Roads</option>
            <option value="DRAINAGE">Drainage</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            className="text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg py-2 px-3 text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">All Statuses</option>
            <option value="REPORTED">Reported</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ESCALATED">Escalated</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" aria-label="Admin grievance triage queue">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Tracking Code
                </th>
                <th scope="col" className="px-4 py-3">
                  Category & Title
                </th>
                <th scope="col" className="px-4 py-3">
                  Priority
                </th>
                <th scope="col" className="px-4 py-3">
                  Impact Score
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3">
                  SLA Countdown
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No grievances found matching selected criteria.
                  </td>
                </tr>
              ) : (
                sorted.map((c) => {
                  const sla = formatTimeRemaining(c.slaDueAt);
                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${
                        c.isEscalated ? "bg-rose-50/40 dark:bg-rose-950/20" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-xs text-primary-600">
                        {c.trackingCode}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                          {c.category.replace("_", " ")}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white truncate block">
                          {c.title}
                        </span>
                        {c.address && (
                          <span className="text-xs text-slate-500 truncate block">{c.address}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={c.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${getScoreColor(
                            c.impactScore,
                          )}`}
                        >
                          {c.impactScore}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status} isEscalated={c.isEscalated} />
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span
                          className={`font-semibold ${
                            sla.isBreached || c.isEscalated
                              ? "text-rose-600 dark:text-rose-400 font-bold"
                              : "text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {sla.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectComplaint(c)}
                            className="min-h-touch px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1"
                            aria-label={`View details for ${c.trackingCode}`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>

                          {c.status !== "RESOLVED" && (
                            <button
                              type="button"
                              onClick={() => onOpenResolve(c)}
                              className="min-h-touch px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                              aria-label={`Resolve ${c.trackingCode}`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Resolve</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
