import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import {
  FilePlus,
  Search,
  LayoutDashboard,
  Globe,
  Sun,
  Moon,
  Contrast,
  LogOut,
  LogIn,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("civic_theme") === "dark";
  });

  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem("civic_high_contrast") === "true";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("civic_theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("civic_theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add("high-contrast");
      localStorage.setItem("civic_high_contrast", "true");
    } else {
      root.classList.remove("high-contrast");
      localStorage.setItem("civic_high_contrast", "false");
    }
  }, [highContrast]);

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const navLinks = [
    { to: "/", label: t("nav.home"), icon: null },
    { to: "/report", label: t("nav.report"), icon: FilePlus },
    { to: "/track", label: t("nav.track"), icon: Search },
    { to: "/transparency", label: t("nav.transparency"), icon: Globe },
    ...(isAdmin ? [{ to: "/admin", label: t("nav.admin"), icon: LayoutDashboard }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md p-1"
          aria-label="CivicResolve Home"
        >
          <div className="w-10 h-10 rounded-lg bg-primary-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
            CR
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {t("app.title")}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
              Coimbatore Municipal Corporation
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center space-x-1" aria-label="Main Navigation">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`min-h-touch px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  isActive
                    ? "text-primary-700 bg-primary-50 dark:text-primary-300 dark:bg-primary-950/60 font-semibold"
                    : "text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:white hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Tools: Language, Contrast, Dark Mode, Auth */}
        <div className="flex items-center space-x-2">
          {/* Language Switcher */}
          <div
            className="relative inline-block text-left"
            role="group"
            aria-label="Language options"
          >
            <select
              value={i18n.language.slice(0, 2)}
              onChange={(e) => handleLanguageChange(e.target.value)}
              aria-label="Select Language"
              className="text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md py-1.5 px-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="en">English (EN)</option>
              <option value="ta">தமிழ் (TA)</option>
              <option value="hi">हिन्दी (HI)</option>
            </select>
          </div>

          {/* High Contrast Toggle */}
          <button
            onClick={() => setHighContrast(!highContrast)}
            className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label={highContrast ? "Disable high contrast" : "Enable high contrast"}
            title="Toggle High Contrast Mode"
          >
            <Contrast className="w-5 h-5" aria-hidden="true" />
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            title="Toggle Dark/Light Mode"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* User Auth Info */}
          {user ? (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-700">
              <span className="hidden lg:inline text-xs font-medium text-slate-600 dark:text-slate-300">
                {user.fullName}{" "}
                {isAdmin && <span className="font-bold text-primary-600">(Admin)</span>}
              </span>
              <button
                onClick={handleLogout}
                className="p-2 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label={t("nav.logout")}
                title={t("nav.logout")}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              <span>{t("nav.login")}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
