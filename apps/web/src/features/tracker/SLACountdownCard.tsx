import React from "react";
import { formatTimeRemaining, formatDate } from "../../lib/utils";
import { Clock, Flame, ShieldAlert } from "lucide-react";

interface SLACountdownCardProps {
  slaDueAt: string | Date;
  slaHours?: number;
  departmentName?: string;
  isEscalated?: boolean;
}

export const SLACountdownCard: React.FC<SLACountdownCardProps> = ({
  slaDueAt,
  slaHours = 48,
  departmentName = "Municipal Corporation",
  isEscalated,
}) => {
  const { text, isBreached } = formatTimeRemaining(slaDueAt);

  return (
    <div
      className={`rounded-xl p-5 border shadow-sm ${
        isBreached || isEscalated
          ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900 text-rose-900 dark:text-rose-200"
          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            SLA Service Level Target
          </span>
          <h4 className="text-base font-bold mt-0.5">{departmentName}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Target Resolution Window: <strong>{slaHours} hours</strong> (Due: {formatDate(slaDueAt)}
            )
          </p>
        </div>

        {isBreached || isEscalated ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-extrabold animate-pulse">
            <Flame className="w-4 h-4" aria-hidden="true" />
            <span>ESCALATED</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-semibold border border-emerald-300 dark:border-emerald-800">
            <Clock className="w-4 h-4" aria-hidden="true" />
            <span>On Schedule</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <span className="text-sm font-medium">SLA Countdown:</span>
        <span
          className={`text-base font-black ${
            isBreached
              ? "text-rose-600 dark:text-rose-400"
              : "text-primary-600 dark:text-primary-400"
          }`}
          aria-live="polite"
        >
          {text}
        </span>
      </div>

      {(isBreached || isEscalated) && (
        <div className="mt-3 text-xs bg-rose-100 dark:bg-rose-900/60 p-2.5 rounded-lg flex items-center gap-2 text-rose-800 dark:text-rose-200">
          <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>
            This grievance has breached standard resolution hours and has been auto-elevated to the
            senior municipal officer queue.
          </span>
        </div>
      )}
    </div>
  );
};
