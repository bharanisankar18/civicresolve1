import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { SkipLink } from "./components/SkipLink";
import { useAuth } from "./hooks/useAuth";
import { Loader2 } from "lucide-react";

// Code splitting via lazy loading to reduce initial bundle size
const HomePage = lazy(() => import("./pages/HomePage").then((m) => ({ default: m.HomePage })));
const ReportPage = lazy(() =>
  import("./pages/ReportPage").then((m) => ({ default: m.ReportPage })),
);
const TrackPage = lazy(() => import("./pages/TrackPage").then((m) => ({ default: m.TrackPage })));
const AdminPage = lazy(() => import("./pages/AdminPage").then((m) => ({ default: m.AdminPage })));
const PublicStatsPage = lazy(() =>
  import("./pages/PublicStatsPage").then((m) => ({ default: m.PublicStatsPage })),
);
const LoginPage = lazy(() => import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() =>
  import("./pages/RegisterPage").then((m) => ({ default: m.RegisterPage })),
);

const PageFallback: React.FC = () => (
  <div
    role="status"
    aria-live="polite"
    className="min-h-[50vh] flex flex-col items-center justify-center gap-3"
  >
    <Loader2 className="w-8 h-8 text-primary-600 animate-spin" aria-hidden="true" />
    <span className="text-xs text-slate-500 font-medium">Loading content...</span>
  </div>
);

export const App: React.FC = () => {
  const { isAdmin } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
      <SkipLink />
      <Navbar />

      <div className="flex-1">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/track" element={<TrackPage />} />
            <Route path="/transparency" element={<PublicStatsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/admin"
              element={isAdmin ? <AdminPage /> : <Navigate to="/login" replace />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>

      <Footer />
    </div>
  );
};
