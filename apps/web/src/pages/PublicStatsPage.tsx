import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { AnalyticsStatsDto } from "@civicresolve/shared";
import { ResolutionCharts } from "../features/analytics/ResolutionCharts";
import { Globe, RefreshCw } from "lucide-react";

export const PublicStatsPage: React.FC = () => {
  const [stats, setStats] = useState<AnalyticsStatsDto | null>(null);

  const loadStats = () => {
    api
      .getPublicStats()
      .then(setStats)
      .catch(() => {});
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <main id="main-content" className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-primary-600" />
            <span>Public Transparency & Resolution Metrics</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Anonymized civic data published under Municipal Open Data Standards • Coimbatore City
          </p>
        </div>

        <button
          type="button"
          onClick={loadStats}
          className="min-h-touch px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Data</span>
        </button>
      </div>

      {stats ? (
        <ResolutionCharts stats={stats} />
      ) : (
        <div className="p-12 text-center text-slate-500 text-sm">
          Loading municipal transparency statistics...
        </div>
      )}
    </main>
  );
};
