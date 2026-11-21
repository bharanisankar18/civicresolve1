import React from "react";
import { ScoreBreakdown, AISource } from "@civicresolve/shared";
import { ShieldCheck, AlertTriangle, Building2, Users, Clock, Bot, Cpu } from "lucide-react";
import { getScoreColor } from "../../lib/utils";

interface ScoreBreakdownCardProps {
  score: number;
  breakdown: ScoreBreakdown;
  aiReasoning?: string | null;
  aiSource?: AISource;
}

export const ScoreBreakdownCard: React.FC<ScoreBreakdownCardProps> = ({
  score,
  breakdown,
  aiReasoning,
  aiSource,
}) => {
  const items = [
    {
      label: "Urgency Assessment",
      score: breakdown.urgency,
      max: 30,
      icon: AlertTriangle,
      color: "bg-amber-500",
    },
    {
      label: "Public Safety Hazard",
      score: breakdown.safetyHazard,
      max: 25,
      icon: ShieldCheck,
      color: "bg-red-500",
    },
    {
      label: "Proximity to Hospital / School",
      score: breakdown.poiProximity,
      max: 25,
      icon: Building2,
      color: "bg-indigo-500",
      hint: breakdown.nearestPoiName
        ? `${breakdown.nearestPoiName} (~${breakdown.distanceToPoiMeters}m)`
        : "Outside critical POI radius (>1km)",
    },
    {
      label: "Citizen Community Support",
      score: breakdown.supportBoost,
      max: 10,
      icon: Users,
      color: "bg-emerald-500",
      hint: `+${breakdown.supportBoost} pts from citizen endorsements`,
    },
    {
      label: "Elapsed SLA Time Factor",
      score: breakdown.ageBoost,
      max: 10,
      icon: Clock,
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Explainable Impact Score</span>
            <span
              className={`px-3 py-1 rounded-full text-base font-extrabold border ${getScoreColor(score)}`}
              aria-label={`Impact score ${score} out of 100`}
            >
              {score} / 100
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Multifactor civic algorithm calculating urgency, pedestrian danger, and geographic
            proximity
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {aiSource === "GEMINI" ? (
            <>
              <Bot className="w-4 h-4 text-primary-500" aria-hidden="true" />
              <span>Gemini Multimodal AI</span>
            </>
          ) : (
            <>
              <Cpu className="w-4 h-4 text-slate-500" aria-hidden="true" />
              <span>Rule-based (AI unavailable)</span>
            </>
          )}
        </div>
      </div>

      {/* AI reasoning explanation */}
      {aiReasoning && (
        <div className="my-4 p-3 bg-primary-50 dark:bg-primary-950/40 rounded-lg border border-primary-100 dark:border-primary-900/50">
          <p className="text-xs font-medium text-primary-900 dark:text-primary-200 flex items-start gap-2">
            <span className="font-bold uppercase tracking-wider text-[10px] bg-primary-200 dark:bg-primary-900 px-1.5 py-0.5 rounded">
              AI Insight
            </span>
            <span>{aiReasoning}</span>
          </p>
        </div>
      )}

      {/* Breakdown list */}
      <div className="space-y-4 mt-4" role="region" aria-label="Score Factor Breakdown">
        {items.map((item) => {
          const Icon = item.icon;
          const percentage = Math.round((item.score / item.max) * 100);
          return (
            <div key={item.label} className="text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Icon className="w-4 h-4 text-slate-400" aria-hidden="true" />
                  <span>{item.label}</span>
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {item.score} <span className="text-xs text-slate-500">/ {item.max}</span>
                </span>
              </div>

              {item.hint && (
                <div className="text-xs text-slate-500 dark:text-slate-400 ml-6 mb-1">
                  {item.hint}
                </div>
              )}

              <div
                className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden"
                role="progressbar"
                aria-label={item.label}
                aria-valuenow={item.score}
                aria-valuemin={0}
                aria-valuemax={item.max}
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
