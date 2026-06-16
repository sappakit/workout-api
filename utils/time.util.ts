export function nowSec() {
  return Math.floor(Date.now() / 1000);
}

// Date -> "YYYY-MM-DD"
export function toUTCDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Date -> 1-7, Monday = 1 and Sunday = 7
export function getISOWeekday(date: Date): number {
  const day = date.getUTCDay();
  return day === 0 ? 7 : day;
}

export function getUtcDayRange(date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);

  return {
    startOfDay,
    endOfDay,
  };
}
