import { MS_PER_DAY } from '@/src/constants/global-time-filter';
import { TimeRange } from '@/src/models/time-range';

export type RangeFsmState =
  | { kind: 'empty' }
  | { kind: 'single'; date: Date }
  | { kind: 'interval'; anchor: Date; latest: Date };

/**
 * Calendar-day difference between two dates (absolute value).
 * Normalizes both dates to local midnight before computing the difference so
 * that time-of-day is ignored and DST transitions do not inflate the count.
 */
export const differenceInCalendarDays = (a: Date, b: Date): number => {
  const aMid = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const bMid = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.abs(Math.round((aMid - bMid) / MS_PER_DAY));
};

const isSameCalendarDay = (a: Date, b: Date): boolean => differenceInCalendarDays(a, b) === 0;

/**
 * Reduce the current range-picker state by a day click. The reducer is pure —
 * calling it with the same state and click always produces the same next state.
 *
 * @param state   current FSM state
 * @param click   the day the user clicked
 * @param maxDays maximum allowed interval length in calendar days (inclusive of
 *                both endpoints). The "reach" from a single anchor is therefore
 *                `maxDays - 1` days in either direction.
 */
export const reduce = (state: RangeFsmState, click: Date, maxDays?: number): RangeFsmState => {
  switch (state.kind) {
    case 'empty':
      return { kind: 'single', date: click };

    case 'single': {
      const delta = differenceInCalendarDays(click, state.date);
      if (!maxDays || delta <= maxDays - 1) {
        return { kind: 'interval', anchor: state.date, latest: click };
      }
      return { kind: 'single', date: click };
    }

    case 'interval': {
      const { anchor, latest } = state;
      const [minDate, maxDate] = anchor.getTime() <= latest.getTime() ? [anchor, latest] : [latest, anchor];

      // endpoint click — collapse to single
      if (isSameCalendarDay(click, anchor) || isSameCalendarDay(click, latest)) {
        return { kind: 'single', date: click };
      }

      const clickBeforeMin = differenceInCalendarDays(click, minDate) > 0 && click.getTime() < minDate.getTime();
      const clickAfterMax = differenceInCalendarDays(click, maxDate) > 0 && click.getTime() > maxDate.getTime();

      // outside current interval — collapse to single
      if (clickBeforeMin || clickAfterMax) {
        return { kind: 'single', date: click };
      }

      // strictly between — shift, preserving the most recent click
      return { kind: 'interval', anchor: latest, latest: click };
    }
  }
};

/**
 * Derive a `[start, end]` pair from FSM state for rendering. Returns `null`
 * when nothing is selected and a single-date tuple `{ start: D, end: null }`
 * when only an anchor has been placed.
 */
export const toDisplayRange = (state: RangeFsmState): { start: Date; end: Date | null } | null => {
  switch (state.kind) {
    case 'empty':
      return null;
    case 'single':
      return { start: state.date, end: null };
    case 'interval': {
      const { anchor, latest } = state;
      const [start, end] = anchor.getTime() <= latest.getTime() ? [anchor, latest] : [latest, anchor];
      return { start, end };
    }
  }
};

/**
 * Hydrate FSM state from a previously committed `TimeRange`. Same-day ranges
 * hydrate as `single`; multi-day ranges hydrate as `interval` with `startDate`
 * as the anchor (the anchor/latest distinction is lost across commit — the
 * first subsequent click re-establishes it, so this choice is inconsequential).
 */
export const hydrate = (range: TimeRange | null): RangeFsmState => {
  if (!range) {
    return { kind: 'empty' };
  }
  if (isSameCalendarDay(range.startDate, range.endDate)) {
    return { kind: 'single', date: range.startDate };
  }
  return { kind: 'interval', anchor: range.startDate, latest: range.endDate };
};

/**
 * Produce a committable `TimeRange` from FSM state. Normalizes start to
 * `00:00:00.000` and end to `23:59:59.999` to match the app-wide query
 * convention. Returns `null` when state is empty.
 *
 * A `single(A)` state commits through the current day rather than through
 * `A` itself — end = `min(today, A + (maxDays - 1) days)` — so one click plus
 * Apply reproduces the "from a point in the past until now" shape every
 * sliding-window preset already has. An `interval` state commits exactly the
 * two dates it holds, with no widening toward today.
 *
 * @param maxDays clamps the widened end so the committed span never exceeds
 *                the cap; unset means no clamp (end = today).
 * @param today   injected so the function stays deterministic under test; the
 *                default reads the clock only at the one call site.
 */
export const toCommit = (state: RangeFsmState, maxDays?: number, today: Date = new Date()): TimeRange | null => {
  const display = toDisplayRange(state);
  if (!display) {
    return null;
  }
  const startDate = new Date(display.start);
  startDate.setHours(0, 0, 0, 0);

  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  let endBase: Date;
  if (display.end === null) {
    // single(A): widen through today, clamped to the cap when one is set
    const cap = maxDays
      ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + (maxDays - 1))
      : todayMidnight;
    endBase = cap.getTime() < todayMidnight.getTime() ? cap : todayMidnight;
  } else {
    endBase = display.end;
  }

  const endDate = new Date(endBase);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
};
