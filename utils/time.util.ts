export function nowSec() {
  return Math.floor(Date.now() / 1000);
}

// Date -> "YYYY-MM-DD" in UTC
export function toUTCDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Date -> ISO weekday in UTC: Monday = 1, Sunday = 7
export function getISOWeekday(date: Date): number {
  const day = date.getUTCDay();

  return day === 0 ? 7 : day;
}

// UTC day range
export function getUtcDayRange(date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const startOfNextDay = new Date(startOfDay);
  startOfNextDay.setUTCDate(startOfNextDay.getUTCDate() + 1);

  return {
    startOfDay,
    startOfNextDay,
  };
}

// UTC ISO week range: Monday 00:00, next Monday 00:00
export function getUtcWeekRange(date = new Date()) {
  const startOfWeek = new Date(date);
  startOfWeek.setUTCHours(0, 0, 0, 0);

  const dayOfWeek = getISOWeekday(startOfWeek);
  startOfWeek.setUTCDate(startOfWeek.getUTCDate() - (dayOfWeek - 1));

  const startOfNextWeek = new Date(startOfWeek);
  startOfNextWeek.setUTCDate(startOfNextWeek.getUTCDate() + 7);

  const displayStartDate = new Date(startOfWeek);

  const displayEndDate = new Date(startOfNextWeek);
  displayEndDate.setUTCDate(displayEndDate.getUTCDate() - 1);

  return {
    queryStartDate: startOfWeek,
    queryEndDate: startOfNextWeek,
    displayStartDate,
    displayEndDate,
  };
}
