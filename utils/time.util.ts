export function nowSec() {
  return Math.floor(Date.now() / 1000);
}

export function normalizeToUTCDate(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function getISOWeekday(date: Date): number {
  const day = date.getUTCDay();
  return day === 0 ? 7 : day;
}
