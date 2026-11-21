import React from "react";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Flame,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { ComplaintStatus, ComplaintPriority } from "@civicresolve/shared";

interface StatusBadgeProps {
  status: ComplaintStatus;
  isEscalated?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, isEscalated }) => {
  if (isEscalated || status === "ESCALATED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border border-rose-300 dark:border-rose-800 animate-pulse">
        <Flame className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" aria-hidden="true" />
        <span>ESCALATED</span>
      </span>
    );
  }

  switch (status) {
    case "REPORTED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
          <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          <span>Reported</span>
        </span>
      );
    case "IN_PROGRESS":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
          <AlertCircle
            className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400"
            aria-hidden="true"
          />
          <span>In Progress</span>
        </span>
      );
    case "RESOLVED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle
            className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400"
            aria-hidden="true"
          />
          <span>Resolved</span>
        </span>
      );
    case "REJECTED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300">
          <XCircle className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" aria-hidden="true" />
          <span>Rejected</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
          <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{status}</span>
        </span>
      );
  }
};

interface PriorityBadgeProps {
  priority: ComplaintPriority;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  switch (priority) {
    case "CRITICAL":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200 border border-red-300">
          <AlertTriangle className="w-3 h-3 text-red-600" aria-hidden="true" />
          <span>Critical</span>
        </span>
      );
    case "HIGH":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200 border border-orange-300">
          <AlertTriangle className="w-3 h-3 text-orange-600" aria-hidden="true" />
          <span>High</span>
        </span>
      );
    case "MEDIUM":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200 border border-yellow-300">
          <span>Medium</span>
        </span>
      );
    case "LOW":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300">
          <span>Low</span>
        </span>
      );
  }
};
