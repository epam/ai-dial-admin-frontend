import { TimeRange } from '@/src/models/time-range';

const DATE_TEXT = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (value: number): string => String(value).padStart(2, '0');

export const toDateText = (date?: Date | null): string =>
  date ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` : '';

export const parseDateText = (text: string): Date | null => {
  const match = DATE_TEXT.exec(text.trim());
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  const isReal = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return isReal ? date : null;
};

export const toTypedRange = (startText: string, endText: string, today: Date = new Date()): TimeRange | null => {
  const startDate = parseDateText(startText);
  const end = parseDateText(endText);
  if (!startDate || !end) return null;

  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);
  const lastAllowed = new Date(today);
  lastAllowed.setHours(23, 59, 59, 999);

  return startDate.getTime() <= endDate.getTime() && endDate.getTime() <= lastAllowed.getTime()
    ? { startDate, endDate }
    : null;
};
