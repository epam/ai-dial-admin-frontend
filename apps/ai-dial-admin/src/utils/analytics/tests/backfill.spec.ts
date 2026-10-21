import { describe, expect, test } from 'vitest';

import { BackfillRangeIssue, BackfillStatus, BackfillWindowKind } from '@/src/models/analytics/backfill-ui';
import { PipelineBackfillPauseReason, PipelineBackfillState } from '@/src/models/analytics/pipeline-backfill';
import { TableBackfillState } from '@/src/models/analytics/table-backfill';
import {
  canRerunTableBackfill,
  formatCalendarDay,
  getBackfillRangeIssue,
  getDayWindowMoments,
  getDaysProgress,
  getPipelineBackfillStatus,
  getRerunRange,
  getSpanInDays,
  getTableBackfillStatus,
  getTodayUtc,
  getWindowView,
  isPipelineBackfillActive,
  isWindowUpToNow,
  parseCalendarDay,
  shouldShowPipelineBackfillBanner,
} from '@/src/utils/analytics/backfill';

const TODAY = '2026-09-24';

describe('getTodayUtc', () => {
  test('reads the UTC date, not the local one', () => {
    expect(getTodayUtc(new Date('2026-09-24T23:30:00.000Z'))).toBe('2026-09-24');
    expect(getTodayUtc(new Date('2026-09-25T00:00:00.000Z'))).toBe('2026-09-25');
  });
});

describe('getSpanInDays', () => {
  test('counts both ends', () => {
    expect(getSpanInDays('2026-09-01', '2026-09-01')).toBe(1);
    expect(getSpanInDays('2026-09-01', '2026-09-30')).toBe(30);
  });

  test('counts across a month and a leap day', () => {
    expect(getSpanInDays('2028-02-28', '2028-03-01')).toBe(3);
  });
});

describe('getBackfillRangeIssue', () => {
  test('accepts an ordered range ending today', () => {
    expect(getBackfillRangeIssue('2026-09-01', TODAY, TODAY)).toBeNull();
  });

  test('accepts a single day', () => {
    expect(getBackfillRangeIssue('2026-09-10', '2026-09-10', TODAY)).toBeNull();
  });

  test.each([
    ['', '2026-09-10'],
    ['2026-09-10', ''],
    ['not-a-date', '2026-09-10'],
    ['2026-02-30', '2026-03-05'],
  ])('reports a missing or unreal date for "%s" to "%s"', (from, to) => {
    expect(getBackfillRangeIssue(from, to, TODAY)).toBe(BackfillRangeIssue.Missing);
  });

  test('reports an inverted range', () => {
    expect(getBackfillRangeIssue('2026-09-10', '2026-09-09', TODAY)).toBe(BackfillRangeIssue.Inverted);
  });

  test('reports a last date after today in UTC', () => {
    expect(getBackfillRangeIssue('2026-09-10', '2026-09-25', TODAY)).toBe(BackfillRangeIssue.InFuture);
  });

  test('reports a span over the limit only when a limit is given', () => {
    expect(getBackfillRangeIssue('2025-01-01', TODAY, TODAY, 366)).toBe(BackfillRangeIssue.TooLong);
    expect(getBackfillRangeIssue('2025-01-01', TODAY, TODAY)).toBeNull();
  });

  test('accepts exactly the limit', () => {
    expect(getBackfillRangeIssue('2025-09-24', '2026-09-23', TODAY, 365)).toBeNull();
    expect(getBackfillRangeIssue('2025-09-24', '2026-09-24', TODAY, 365)).toBe(BackfillRangeIssue.TooLong);
  });

  test('reports the first problem in a fixed order', () => {
    expect(getBackfillRangeIssue('2026-09-30', '2026-09-26', TODAY)).toBe(BackfillRangeIssue.Inverted);
  });
});

describe('formatCalendarDay and parseCalendarDay', () => {
  test('round-trips a day through the picker value', () => {
    const date = parseCalendarDay('2026-03-05');

    expect(date).not.toBeNull();
    expect(formatCalendarDay(date as Date)).toBe('2026-03-05');
  });

  test('reads the date from the local fields, so a picker value is the day the reader chose', () => {
    expect(formatCalendarDay(new Date(2026, 0, 9))).toBe('2026-01-09');
  });

  test('refuses a day that is not on the calendar', () => {
    expect(parseCalendarDay('2026-02-30')).toBeNull();
    expect(parseCalendarDay('')).toBeNull();
  });
});

describe('getDayWindowMoments', () => {
  test('opens one millisecond before the first day and closes on the last millisecond of the last', () => {
    expect(getDayWindowMoments('2026-09-14', '2026-09-21')).toEqual({
      from: '2026-09-13T23:59:59.999Z',
      to: '2026-09-21T23:59:59.999Z',
    });
  });

  test('crosses a year boundary', () => {
    expect(getDayWindowMoments('2026-01-01', '2026-01-01').from).toBe('2025-12-31T23:59:59.999Z');
  });
});

describe('getWindowView', () => {
  test('reads no bounds as everything', () => {
    expect(getWindowView(undefined, undefined)).toEqual({ kind: BackfillWindowKind.Everything });
    expect(getWindowView(null, null)).toEqual({ kind: BackfillWindowKind.Everything });
  });

  test('turns whole-day bounds back into the days that were chosen', () => {
    const { from, to } = getDayWindowMoments('2026-09-14', '2026-09-21');

    expect(getWindowView(from, to)).toEqual({ kind: BackfillWindowKind.Days, from: '2026-09-14', to: '2026-09-21' });
  });

  test('keeps an open bound open', () => {
    expect(getWindowView(undefined, '2026-09-21T23:59:59.999Z')).toEqual({
      kind: BackfillWindowKind.Days,
      from: undefined,
      to: '2026-09-21',
    });
  });

  test('shows a bound that is not on a day boundary as the exact moment', () => {
    expect(getWindowView('2026-09-14T08:30:00.000Z', '2026-09-21T23:59:59.999Z')).toEqual({
      kind: BackfillWindowKind.Moments,
      from: '2026-09-14T08:30:00.000Z',
      to: '2026-09-21T23:59:59.999Z',
    });
  });

  test('does not read an upper bound at midnight as a closed day', () => {
    expect(getWindowView('2026-09-13T23:59:59.999Z', '2026-09-21T00:00:00.000Z').kind).toBe(BackfillWindowKind.Moments);
  });
});

describe('isWindowUpToNow', () => {
  test('is true for whole days closing on today', () => {
    expect(isWindowUpToNow({ kind: BackfillWindowKind.Days, from: '2026-09-20', to: TODAY }, TODAY)).toBe(true);
  });

  test('is false for an earlier last day, for moments and for everything', () => {
    expect(isWindowUpToNow({ kind: BackfillWindowKind.Days, from: '2026-09-20', to: '2026-09-23' }, TODAY)).toBe(false);
    expect(isWindowUpToNow({ kind: BackfillWindowKind.Moments, to: TODAY }, TODAY)).toBe(false);
    expect(isWindowUpToNow({ kind: BackfillWindowKind.Everything }, TODAY)).toBe(false);
  });
});

describe('getBackfillRangeIssue with an out-of-range date', () => {
  test('refuses 2026-13-45 as missing instead of throwing', () => {
    expect(getBackfillRangeIssue('2026-13-45', '2026-13-46', TODAY)).toBe(BackfillRangeIssue.Missing);
  });
});

describe('getRerunRange', () => {
  const range = { from: '2026-09-01', to: '2026-09-30' };

  test('starts at the earliest failed day and ends at the original end', () => {
    expect(getRerunRange({ ...range, failedDates: ['2026-09-17', '2026-09-04'] })).toEqual({
      from: '2026-09-04',
      to: '2026-09-30',
    });
  });

  test('covers the days a run that stopped early never reached', () => {
    // The run stopped on the 17th and names only the days it attempted; the original end still covers 18–30.
    expect(getRerunRange({ ...range, failedDates: ['2026-09-04', '2026-09-17'] }).to).toBe('2026-09-30');
  });

  test('does not reorder the caller’s list', () => {
    const failedDates = ['2026-09-17', '2026-09-04'];

    getRerunRange({ ...range, failedDates });

    expect(failedDates).toEqual(['2026-09-17', '2026-09-04']);
  });

  test.each([[undefined], [null], [[]]])('covers the whole original range when failed days are %j', (failedDates) => {
    expect(getRerunRange({ ...range, failedDates: failedDates as string[] | null | undefined })).toEqual(range);
  });
});

describe('getDaysProgress', () => {
  const run = { daysTotal: 30, daysCompleted: 10, daysFailed: 1 };

  test('is the day being worked on while running', () => {
    expect(getDaysProgress({ ...run, state: TableBackfillState.Running })).toBe(12);
  });

  test('never passes the total', () => {
    expect(getDaysProgress({ ...run, daysCompleted: 30, daysFailed: 0, state: TableBackfillState.Running })).toBe(30);
  });

  test('counts a failed day as finished once the run has ended', () => {
    expect(getDaysProgress({ ...run, daysCompleted: 28, daysFailed: 2, state: TableBackfillState.Completed })).toBe(30);
  });

  test('stops short for a run that ended early', () => {
    expect(getDaysProgress({ ...run, daysCompleted: 10, daysFailed: 1, state: TableBackfillState.Failed })).toBe(11);
  });
});

describe('status mapping', () => {
  test('presents the ingest service’s completed as Done', () => {
    expect(getTableBackfillStatus(TableBackfillState.Completed)).toBe(BackfillStatus.Done);
    expect(getTableBackfillStatus(TableBackfillState.Running)).toBe(BackfillStatus.Running);
    expect(getTableBackfillStatus(TableBackfillState.Failed)).toBe(BackfillStatus.Failed);
  });

  test('reads a finished group pipeline run as Queued and no other state as such', () => {
    expect(getPipelineBackfillStatus(PipelineBackfillState.Done, true)).toBe(BackfillStatus.Queued);
    expect(getPipelineBackfillStatus(PipelineBackfillState.Running, true)).toBe(BackfillStatus.Running);
    expect(getPipelineBackfillStatus(PipelineBackfillState.Cancelled, true)).toBe(BackfillStatus.Cancelled);
    expect(getPipelineBackfillStatus(PipelineBackfillState.Paused, true)).toBe(BackfillStatus.Paused);
  });

  test('reads a finished run of any other pipeline as Done', () => {
    expect(getPipelineBackfillStatus(PipelineBackfillState.Done, false)).toBe(BackfillStatus.Done);
  });
});

describe('isPipelineBackfillActive', () => {
  test.each([
    [PipelineBackfillState.Running, true],
    [PipelineBackfillState.Paused, true],
    [PipelineBackfillState.Done, false],
    [PipelineBackfillState.Cancelled, false],
  ])('is %s → %s', (state, expected) => {
    expect(isPipelineBackfillActive({ state })).toBe(expected);
  });
});

describe('shouldShowPipelineBackfillBanner', () => {
  test('shows a running run', () => {
    expect(shouldShowPipelineBackfillBanner({ state: PipelineBackfillState.Running })).toBe(true);
  });

  test.each([
    PipelineBackfillPauseReason.Operator,
    PipelineBackfillPauseReason.SpendBudgetExhausted,
    PipelineBackfillPauseReason.CursorStalled,
    PipelineBackfillPauseReason.PipelineAbsent,
    PipelineBackfillPauseReason.PipelineChanged,
  ])('shows a run paused for its own reason: %s', (reason) => {
    expect(shouldShowPipelineBackfillBanner({ state: PipelineBackfillState.Paused, paused_reason: reason })).toBe(true);
  });

  test.each([PipelineBackfillPauseReason.PipelinePausedOperator, PipelineBackfillPauseReason.PipelinePausedBreaker])(
    'leaves a run paused with its pipeline to the pipeline’s banner: %s',
    (reason) => {
      expect(shouldShowPipelineBackfillBanner({ state: PipelineBackfillState.Paused, paused_reason: reason })).toBe(
        false,
      );
    },
  );

  test('shows a paused run that reports no reason', () => {
    expect(shouldShowPipelineBackfillBanner({ state: PipelineBackfillState.Paused })).toBe(true);
  });

  test('shows nothing for a finished run', () => {
    expect(shouldShowPipelineBackfillBanner({ state: PipelineBackfillState.Done })).toBe(false);
    expect(shouldShowPipelineBackfillBanner({ state: PipelineBackfillState.Cancelled })).toBe(false);
  });
});

describe('canRerunTableBackfill', () => {
  const failedDates = ['2026-09-04'];

  test('offers a re-run for a Done run with failed days and for a Failed one', () => {
    expect(canRerunTableBackfill({ state: TableBackfillState.Completed, failedDates }, false)).toBe(true);
    expect(canRerunTableBackfill({ state: TableBackfillState.Failed, failedDates }, false)).toBe(true);
  });

  test('offers nothing while a run is in progress', () => {
    expect(canRerunTableBackfill({ state: TableBackfillState.Completed, failedDates }, true)).toBe(false);
  });

  test('offers nothing for a clean Done run', () => {
    expect(canRerunTableBackfill({ state: TableBackfillState.Completed }, false)).toBe(false);
    expect(canRerunTableBackfill({ state: TableBackfillState.Completed, failedDates: [] }, false)).toBe(false);
  });

  test('offers a re-run for a Failed run that named no failed day', () => {
    expect(canRerunTableBackfill({ state: TableBackfillState.Failed }, false)).toBe(true);
  });

  test('offers nothing for the run that is itself running', () => {
    expect(canRerunTableBackfill({ state: TableBackfillState.Running, failedDates }, false)).toBe(false);
  });
});
