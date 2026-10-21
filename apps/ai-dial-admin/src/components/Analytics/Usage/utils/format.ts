import { TimeRange } from '@/src/models/time-range';

/**
 * One locale for every figure on the page, rather than the reader's own: a mixed set would separate
 * thousands with a comma in one widget and a space in the next, and the figures are read against
 * each other.
 */
export const GROUPING_LOCALE = 'en-US';

const UNITS = [
  { threshold: 1e9, suffix: 'B' },
  { threshold: 1e6, suffix: 'M' },
  { threshold: 1e3, suffix: 'K' },
];

/**
 * A figure abbreviated to fit a card that holds one of them.
 *
 * The unit comes back separately because a card renders it smaller than the digits. This is the
 * card's form only: a column of figures is compared row to row, and `1.0M` against `1.2M` hides the
 * difference the column exists to show.
 */
export const formatCompactNumber = (value: number): { value: string; unit?: string } => {
  const unit = UNITS.find(({ threshold }) => Math.abs(value) >= threshold);

  if (!unit) {
    return { value: String(Math.round(value)) };
  }

  return { value: (value / unit.threshold).toFixed(1), unit: unit.suffix };
};

export const formatMoney = (value: number): { value: string; unit?: string } => {
  if (Math.abs(value) >= 1000) {
    const compact = formatCompactNumber(value);

    return { value: `$${compact.value}`, unit: compact.unit };
  }

  return { value: `$${value.toFixed(2)}` };
};

/**
 * A figure in full, with its thousands separated — what everything outside the cards states.
 *
 * A table's column is read down and compared row to row, and there an abbreviation hides the
 * difference the column exists to show, so the figure is stated and the width follows.
 */
export const formatGroupedNumber = (value: number, fractionDigits = 0): string =>
  value.toLocaleString(GROUPING_LOCALE, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
/** A percentage, grouped like every other figure: a change of 2504.4% reads as `2,504.4%`. */
export const formatPercent = (ratio: number, fractionDigits = 1): string =>
  `${formatGroupedNumber(ratio * 100, fractionDigits)}%`;

/** Money in full: the same grouping, and the two decimals a price is quoted in. */
export const formatGroupedMoney = (value: number): string => `$${formatGroupedNumber(value, 2)}`;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * A bin of a day or more is epoch-aligned, so it starts at 00:00 UTC and is named in UTC. Reading
 * it in the browser's zone renamed it: west of Greenwich the bin's own midnight falls on the
 * previous local date, and with no clock printed nothing on screen says so.
 */
const DATE_ONLY: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', timeZone: 'UTC' };
const DATE_AND_TIME: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};
const TIME_ONLY: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };

/**
 * A bucket as the period it covers, from its start to the start of the next one.
 *
 * A bucket's own timestamp names only where it begins, so a tooltip stating it alone left the reader
 * to work out how much traffic it was looking at — an hour's worth or a week's. The end is stated
 * as the next bucket's start, which is what the bound the query used actually is.
 *
 * A step of a day or more needs no clock, and one shorter than a day states the time twice while
 * naming the day once — unless the period crosses midnight, where the second day has to be named.
 */
export const formatBucketRange = (bucketMs: number, stepMs: number): string => {
  const start = new Date(bucketMs);
  const end = new Date(bucketMs + stepMs);

  if (stepMs >= MS_PER_DAY) {
    return `${start.toLocaleDateString(void 0, DATE_ONLY)} – ${end.toLocaleDateString(void 0, DATE_ONLY)}`;
  }

  const isSameDay = start.toDateString() === end.toDateString();

  return `${start.toLocaleString(void 0, DATE_AND_TIME)} – ${
    isSameDay ? end.toLocaleTimeString(void 0, TIME_ONLY) : end.toLocaleString(void 0, DATE_AND_TIME)
  }`;
};

/**
 * The change from the previous window to the current one. `null` means there is nothing to state —
 * either window is unknown, or both are zero; growth from zero is reported separately as new
 * activity rather than as an infinite change.
 */
export const getDeltaRatio = (current: number | null, previous: number | null): number | null => {
  if (current == null || previous == null || previous === 0) {
    return null;
  }

  return (current - previous) / previous;
};

export const formatDuration = (milliseconds: number): { value: string; unit?: string } =>
  milliseconds < 1000
    ? { value: String(Math.round(milliseconds)), unit: 'ms' }
    : { value: (milliseconds / 1000).toFixed(1), unit: 's' };

export const formatWindowBound = (date: Date, isSameDay: boolean): string =>
  date.toLocaleString(
    void 0,
    isSameDay
      ? { hour: '2-digit', minute: '2-digit' }
      : { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
  );

/** Both bounds at once, so every widget states the same window the same way. */
export const getWindowBounds = (window: TimeRange): { from: string; to: string } => {
  const isSameDay = window.startDate.toDateString() === window.endDate.toDateString();

  return {
    from: formatWindowBound(window.startDate, isSameDay),
    to: formatWindowBound(window.endDate, isSameDay),
  };
};
