import React, { useState, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Link } from "react-router-dom";
import { ComplaintPriority, ComplaintStatus } from "@civicresolve/shared";
import { Table, Map as MapIcon } from "lucide-react";
import { StatusBadge } from "../../components/Badge";

interface HeatmapPoint {
  id: string;
  trackingCode: string;
  title: string;
  category: string;
  priority: ComplaintPriority;
  status: ComplaintStatus | string;
  impactScore: number;
  lat: number;
  lng: number;
  address?: string | null;
  createdAt: string | Date;
}

interface CivicHeatmapProps {
  points: HeatmapPoint[];
}

export const CivicHeatmap: React.FC<CivicHeatmapProps> = ({ points }) => {
  const [viewMode, setViewMode] = useState<"map" | "table">("map");

  // Center around Coimbatore City, Tamil Nadu
  const defaultCenter = [11.0168, 76.9558] as [number, number];

  const getColor = (priority: ComplaintPriority, score: number) => {
    if (score >= 75 || priority === "CRITICAL") return "#e11d48"; // Rose/Red
    if (score >= 50 || priority === "HIGH") return "#ea580c"; // Orange
    if (priority === "MEDIUM") return "#d97706"; // Amber
    return "#10b981"; // Emerald
  };

  // Max markers to render simultaneously on Leaflet canvas/SVG layer to avoid DOM choking with 4,000+ points
  const MAX_MAP_MARKERS = 300;

  const displayPoints = useMemo(() => {
    if (points.length <= MAX_MAP_MARKERS) return points;
    // Prioritize highest-impact issues on the map for high-density datasets
    return points
      .slice()
      .sort((a, b) => b.impactScore - a.impactScore)
      .slice(0, MAX_MAP_MARKERS);
  }, [points]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Civic Issue Spatial Heatmap</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300">
              {points.length > MAX_MAP_MARKERS
                ? `${displayPoints.length} of ${points.length} Highest-Impact Shown`
                : `${points.length} Active Issues`}
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time geospatial distribution of municipal grievances across Coimbatore wards.
            {points.length > MAX_MAP_MARKERS &&
              " (Top 300 highest-impact mapped for rendering performance; switch to Table for all records.)"}
          </p>
        </div>

        {/* View Toggle for WCAG Screen Readers */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "map" ? "table" : "map")}
            className="min-h-touch px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
            aria-label={
              viewMode === "map"
                ? "Switch to accessible table alternative"
                : "Switch to interactive map"
            }
          >
            {viewMode === "map" ? (
              <>
                <Table className="w-4 h-4" />
                <span>Accessible Table Alternative</span>
              </>
            ) : (
              <>
                <MapIcon className="w-4 h-4" />
                <span>Show Interactive Map</span>
              </>
            )}
          </button>
        </div>
      </div>

      {viewMode === "map" ? (
        <div
          role="region"
          aria-label="Civic grievances interactive map"
          className="w-full h-96 sm:h-[450px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 relative z-0"
        >
          <MapContainer
            center={defaultCenter}
            zoom={12}
            scrollWheelZoom={false}
            style={{ width: "100%", height: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {displayPoints.map((pt) => (
              <CircleMarker
                key={pt.id}
                center={[pt.lat, pt.lng]}
                radius={Math.max(6, Math.min(16, pt.impactScore / 6))}
                pathOptions={{
                  color: getColor(pt.priority, pt.impactScore),
                  fillColor: getColor(pt.priority, pt.impactScore),
                  fillOpacity: 0.65,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="text-xs p-1 space-y-1">
                    <span className="font-mono font-bold text-primary-600 block">
                      {pt.trackingCode}
                    </span>
                    <strong className="block text-slate-900">{pt.title}</strong>
                    <div className="text-slate-600">{pt.address || "Coimbatore"}</div>
                    <div className="flex items-center gap-2 pt-1">
                      <span>
                        Impact: <strong>{pt.impactScore}/100</strong>
                      </span>
                    </div>
                    <Link
                      to={`/track?code=${pt.trackingCode}`}
                      className="text-primary-600 font-bold underline block pt-1"
                    >
                      View Grievance Tracker
                    </Link>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      ) : (
        /* Accessible Table Alternative */
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
          <table className="w-full text-left text-xs" aria-label="Tabular list of civic grievances">
            <thead className="bg-slate-50 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300">
              <tr>
                <th scope="col" className="p-3">
                  Tracking Code
                </th>
                <th scope="col" className="p-3">
                  Title
                </th>
                <th scope="col" className="p-3">
                  Category
                </th>
                <th scope="col" className="p-3">
                  Status
                </th>
                <th scope="col" className="p-3">
                  Coordinates
                </th>
                <th scope="col" className="p-3">
                  Impact Score
                </th>
                <th scope="col" className="p-3">
                  Address
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {points.map((pt) => (
                <tr key={pt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td scope="row" className="p-3 font-mono font-bold text-primary-600">
                    {pt.trackingCode}
                  </td>
                  <td className="p-3 font-medium">{pt.title}</td>
                  <td className="p-3">{pt.category}</td>
                  <td className="p-3">
                    <StatusBadge status={pt.status as ComplaintStatus} />
                  </td>
                  <td className="p-3 font-mono">
                    {pt.lat.toFixed(4)}, {pt.lng.toFixed(4)}
                  </td>
                  <td className="p-3 font-bold">{pt.impactScore}</td>
                  <td className="p-3 text-slate-500">{pt.address || "Coimbatore"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
