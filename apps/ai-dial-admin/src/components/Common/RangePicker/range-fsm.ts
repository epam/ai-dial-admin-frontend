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
      if (delta === 0) {
        // clicking the same day — no-op, keep single
        return state;
      }
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
 */
export const toCommit = (state: RangeFsmState): TimeRange | null => {
  const display = toDisplayRange(state);
  if (!display) {
    return null;
  }
  const startDate = new Date(display.start);
  startDate.setHours(0, 0, 0, 0);

  const endSource = display.end ?? display.start;
  const endDate = new Date(endSource);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
};
