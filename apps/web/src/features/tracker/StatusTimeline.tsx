import React from "react";
import { StatusEventDto, ComplaintStatus } from "@civicresolve/shared";
import { CheckCircle2, Clock, Wrench, AlertTriangle, UserCheck } from "lucide-react";
import { formatDate } from "../../lib/utils";

interface StatusTimelineProps {
  events: StatusEventDto[];
  currentStatus: ComplaintStatus;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ events }) => {
  const getIcon = (status: ComplaintStatus) => {
    switch (status) {
      case "REPORTED":
        return Clock;
      case "IN_PROGRESS":
        return Wrench;
      case "RESOLVED":
        return CheckCircle2;
      case "ESCALATED":
        return AlertTriangle;
      default:
        return UserCheck;
    }
  };

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
        Official Grievance Timeline
      </h3>

      <ol className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-6">
        {sortedEvents.map((evt, idx) => {
          const Icon = getIcon(evt.status);
          const isLatest = idx === sortedEvents.length - 1;

          return (
            <li key={evt.id || idx} className="mb-6 ml-6">
              <span
                className={`absolute -left-3.5 flex items-center justify-center w-7 h-7 rounded-full ring-4 ring-white dark:ring-slate-900 ${
                  isLatest
                    ? evt.status === "ESCALATED"
                      ? "bg-rose-600 text-white animate-pulse"
                      : evt.status === "RESOLVED"
                        ? "bg-emerald-600 text-white"
                        : "bg-primary-600 text-white"
                    : "bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
              </span>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {evt.status.replace("_", " ")}
                </h4>
                <time className="text-xs text-slate-500 dark:text-slate-400">
                  {formatDate(evt.createdAt)}
                </time>
              </div>

              {evt.remarks && (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  {evt.remarks}
                </p>
              )}

              {evt.updatedBy && (
                <div className="mt-1 text-xs text-slate-400 flex items-center gap-1">
                  <span>Updated by: {evt.updatedBy.fullName}</span>
                  <span className="uppercase text-[10px] font-semibold">
                    ({evt.updatedBy.role})
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};
