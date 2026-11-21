import React from "react";
import { useTranslation } from "react-i18next";

export const SkipLink: React.FC = () => {
  const { t } = useTranslation();
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white font-medium text-sm transition"
    >
      {t("nav.skipToContent")}
    </a>
  );
};
