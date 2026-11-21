import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | Date | undefined): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTimeRemaining(slaDueAt: string | Date | undefined): {
  text: string;
  isBreached: boolean;
} {
  if (!slaDueAt) return { text: "N/A", isBreached: false };

  const due = new Date(slaDueAt).getTime();
  const now = Date.now();
  const diffMs = due - now;

  if (diffMs <= 0) {
    const overdueHours = Math.abs(Math.round(diffMs / (3600 * 1000)));
    return {
      text: `Breached by ${overdueHours}h`,
      isBreached: true,
    };
  }

  const hoursRemaining = Math.round(diffMs / (3600 * 1000));
  if (hoursRemaining > 24) {
    const days = Math.floor(hoursRemaining / 24);
    const rem = hoursRemaining % 24;
    return {
      text: `${days}d ${rem}h remaining`,
      isBreached: false,
    };
  }

  return {
    text: `${hoursRemaining}h remaining`,
    isBreached: false,
  };
}

export function getScoreColor(score: number): string {
  if (score >= 75)
    return "text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-950 border-red-300";
  if (score >= 50)
    return "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-950 border-amber-300";
  return "text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950 border-emerald-300";
}
