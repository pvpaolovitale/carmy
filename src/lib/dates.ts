/**
 * Returns the ISO "YYYY-MM-DD" date string for the Monday of the current week.
 * This is the canonical key used to look up the active weekly plan in Convex.
 */
export function getCurrentWeekMonday(): string {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = day === 0 ? 1 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().split('T')[0];
}
