import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { AnalyticsStatsDto } from "@civicresolve/shared";
import { FilePlus, Search, ShieldCheck, Zap, Globe, TrendingUp, Sparkles } from "lucide-react";

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<AnalyticsStatsDto | null>(null);

  useEffect(() => {
    api
      .getPublicStats()
      .then(setStats)
      .catch(() => {});
  }, []);

  return (
    <main id="main-content" className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white dark:from-slate-900 dark:to-slate-950 py-16 sm:py-24 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-800 dark:text-primary-300 text-xs font-bold mb-6 border border-primary-200 dark:border-primary-800">
            <Sparkles className="w-3.5 h-3.5 text-primary-600" />
            <span>AI-Powered Grievance Redressal • Coimbatore</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight max-w-4xl mx-auto">
            {t("app.subtitle")}
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {t("app.tagline")}
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/report"
              className="min-h-touch px-6 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm sm:text-base flex items-center gap-2 shadow-lg hover:shadow-primary-500/25 transition focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <FilePlus className="w-5 h-5" aria-hidden="true" />
              <span>{t("nav.report")}</span>
            </Link>

            <Link
              to="/track"
              className="min-h-touch px-6 py-3.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-sm sm:text-base border border-slate-200 dark:border-slate-700 flex items-center gap-2 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <Search className="w-5 h-5" aria-hidden="true" />
              <span>{t("nav.track")}</span>
            </Link>

            <Link
              to="/transparency"
              className="min-h-touch px-6 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm sm:text-base flex items-center gap-2 transition focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <Globe className="w-5 h-5" aria-hidden="true" />
              <span>{t("nav.transparency")}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Live Municipality Highlights */}
      {stats && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Total Grievances Handled
              </span>
              <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-2 block">
                {stats.totalComplaints}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block">
                Resolution Success Rate
              </span>
              <span className="text-3xl sm:text-4xl font-black text-emerald-600 mt-2 block">
                {stats.resolutionRatePercentage}%
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Average Resolution Time
              </span>
              <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-2 block">
                {stats.averageResolutionHours}h
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
              <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider block">
                Overdue / Escalated
              </span>
              <span className="text-3xl sm:text-4xl font-black text-rose-600 mt-2 block">
                {stats.escalatedComplaints}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Feature Pillar Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Transforming Civic Grievance Management
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Advanced multimodal intelligence coupled with strict SLA accountability
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-primary-300 transition">
            <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-950 flex items-center justify-center text-primary-600 mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Photo-First & Multilingual
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Snap a picture or speak in Tamil, Hindi, or English. Google Gemini instantly
              identifies the defect category, urgency, and recommended department.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-primary-300 transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Explainable Impact Scoring
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Every complaint receives an objective 0-100 score factoring urgency, safety hazard,
              proximity to schools and hospitals, and community endorsements.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-primary-300 transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 mb-6">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Gemini Verified Resolutions
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Municipal teams submit "after" photos which Gemini compares against the original issue
              to ensure the repair is genuine before closing the case.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};
