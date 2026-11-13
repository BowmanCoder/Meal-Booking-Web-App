// Dates travel between the app and the API as plain "YYYY-MM-DD" strings.
// These helpers work in the browser's local calendar and never involve UTC,
// which avoids off-by-one-day bugs around midnight.

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(iso: string, days: number): string {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function addMonths(iso: string, months: number): string {
  const date = parseISODate(iso);
  return toISODate(new Date(date.getFullYear(), date.getMonth() + months, 1));
}

/** Monday of the week containing `iso`. */
export function startOfWeek(iso: string): string {
  const mondayBased = (parseISODate(iso).getDay() + 6) % 7;
  return addDays(iso, -mondayBased);
}

export function startOfMonth(iso: string): string {
  const date = parseISODate(iso);
  return toISODate(new Date(date.getFullYear(), date.getMonth(), 1));
}

/** Every date from `from` to `to`, inclusive. */
export function eachDay(from: string, to: string): string[] {
  const days: string[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) days.push(day);
  return days;
}

export function formatDate(iso: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(undefined, options).format(parseISODate(iso));
}

/** "09:30" for an ISO date-time, in the browser's local time. */
export function formatTime(isoDateTime: string): string {
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(
    new Date(isoDateTime),
  );
}

/** "Thu 12 Nov, 09:30" for an ISO date-time. */
export function formatDateTime(isoDateTime: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoDateTime));
}
