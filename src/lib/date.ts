export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));

export const WEEKDAYS_MON = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const WEEKDAYS_SUN = ["SUN", "MON", "TUE", "WED", "THUR", "FRI", "SAT"];

export type CalendarCell = {
  /** ISO-ish key, e.g. 2026-11-04 */
  key: string;
  day: number;
  month: number;
  year: number;
  inMonth: boolean;
};

const pad = (n: number) => String(n).padStart(2, "0");

export function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Six-row calendar matrix. `weekStartsOn` 1 = Monday, 0 = Sunday.
 */
export function monthMatrix(
  year: number,
  month: number,
  weekStartsOn: 0 | 1 = 1,
): CalendarCell[][] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const lead = (firstWeekday - weekStartsOn + 7) % 7;
  const start = new Date(year, month, 1 - lead);

  const weeks: CalendarCell[][] = [];
  for (let w = 0; w < 6; w++) {
    const row: CalendarCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate() + w * 7 + d,
      );
      row.push({
        key: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
        day: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        inMonth: date.getMonth() === month && date.getFullYear() === year,
      });
    }
    weeks.push(row);
  }
  return weeks;
}

export function weekdayShort(year: number, month: number, day: number) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
    new Date(year, month, day).getDay()
  ];
}

export function formatLongDate(year: number, month: number, day: number) {
  return `${MONTHS_SHORT[month]} ${pad(day)}, ${year}`;
}

export function monthLabel(year: number, month: number) {
  return `${MONTHS[month]} ${year}`;
}
