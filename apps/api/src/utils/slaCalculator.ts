/**
 * Computes SLA due date based on creation time and department SLA hours
 */
export function calculateSlaDueDate(createdAt: Date, slaHours: number): Date {
  return new Date(createdAt.getTime() + slaHours * 3600 * 1000);
}

/**
 * Checks whether an active complaint has breached its SLA window
 */
export function isSlaBreached(
  slaDueAt: Date,
  currentStatus: string,
  now: Date = new Date(),
): boolean {
  if (currentStatus === "RESOLVED" || currentStatus === "REJECTED") {
    return false;
  }
  return now.getTime() > slaDueAt.getTime();
}

/**
 * Computes remaining SLA hours (can be negative if breached)
 */
export function getRemainingSlaHours(slaDueAt: Date, now: Date = new Date()): number {
  const diffMs = slaDueAt.getTime() - now.getTime();
  return Math.round(diffMs / (3600 * 1000));
}
