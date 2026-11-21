import React from "react";
import { Phone, CheckCircle2, Shield } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
        <div className="flex items-center space-x-3">
          <Shield className="w-5 h-5 text-primary-600" aria-hidden="true" />
          <span>
            © {new Date().getFullYear()} CivicResolve. Official Coimbatore Civic Grievance Redressal
            Portal.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300 font-medium">
            <Phone className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            <span>
              Toll Free Helpline: <strong>1913</strong>
            </span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
            <span>WCAG 2.2 AA Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
