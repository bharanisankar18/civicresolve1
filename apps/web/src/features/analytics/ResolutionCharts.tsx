import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { AnalyticsStatsDto } from "@civicresolve/shared";
import { BarChart3, TrendingUp, Clock, CheckCircle } from "lucide-react";

interface ResolutionChartsProps {
  stats: AnalyticsStatsDto;
}

export const ResolutionCharts: React.FC<ResolutionChartsProps> = ({ stats }) => {
  const categoryData = Object.entries(stats.categoryCounts).map(([name, count]) => ({
    name: name.replace("_", " "),
    count,
  }));

  const statusData = [
    { name: "Resolved", value: stats.resolvedComplaints, color: "#10b981" },
    { name: "In Progress", value: stats.inProgressComplaints, color: "#f59e0b" },
    { name: "Escalated", value: stats.escalatedComplaints, color: "#ef4444" },
    {
      name: "Reported",
      value: Math.max(
        0,
        stats.totalComplaints -
          (stats.resolvedComplaints + stats.inProgressComplaints + stats.escalatedComplaints),
      ),
      color: "#0ea5e9",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Grievances
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {stats.totalComplaints}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Resolution Rate
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.resolutionRatePercentage}%
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Avg Resolution Time
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {stats.averageResolutionHours}{" "}
            <span className="text-sm font-normal text-slate-500">hours</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            SLA Escalated
          </span>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {stats.escalatedComplaints}
          </div>
        </div>
      </div>

      {/* Visual Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution BarChart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary-600" />
            <span>Grievances by Category</span>
          </h4>
          <div
            className="h-64 w-full"
            role="region"
            aria-label="Bar chart showing grievances by category"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="name"
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 10 }}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Accessible Data Table for Screen Readers */}
          <table className="sr-only" aria-label="Grievance counts by category">
            <thead>
              <tr>
                <th scope="col">Category</th>
                <th scope="col">Count</th>
              </tr>
            </thead>
            <tbody>
              {categoryData.map((d) => (
                <tr key={d.name}>
                  <td>{d.name}</td>
                  <td>{d.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Status Distribution PieChart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Municipal Resolution Status</span>
          </h4>
          <div
            className="h-64 w-full"
            role="region"
            aria-label="Pie chart showing municipal resolution status distribution"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Accessible Data Table for Screen Readers */}
          <table className="sr-only" aria-label="Grievance counts by resolution status">
            <thead>
              <tr>
                <th scope="col">Status</th>
                <th scope="col">Count</th>
              </tr>
            </thead>
            <tbody>
              {statusData.map((d) => (
                <tr key={d.name}>
                  <td>{d.name}</td>
                  <td>{d.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
