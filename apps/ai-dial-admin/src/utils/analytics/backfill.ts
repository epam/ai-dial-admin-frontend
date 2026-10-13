import {
  MS_PER_DAY,
  PIPELINE_BACKFILL_STATUS,
  PIPELINE_PAUSE_REASONS,
  TABLE_BACKFILL_STATUS,
} from '@/src/constants/analytics/backfill';
import { BackfillI18nKey } from '@/src/constants/i18n';
import {
  BackfillRangeIssue,
  BackfillRerunRange,
  BackfillStatus,
  BackfillWindowKind,
  BackfillWindowMoments,
  BackfillWindowView,
} from '@/src/models/analytics/backfill-ui';
import { PipelineBackfillRun, PipelineBackfillState } from '@/src/models/analytics/pipeline-backfill';
import { TableBackfillRun, TableBackfillState } from '@/src/models/analytics/table-backfill';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const LAST_MS_OF_DAY = 'T23:59:59.999Z';

const dayStartMs = (day: string): number => Date.parse(`${day}T00:00:00.000Z`);

/**
 * `Date.parse` rolls 30 February over to 2 March instead of refusing it, so a calendar date is only real when
 * it survives the trip back to a string.
 */
const isCalendarDate = (day: string): boolean =>
  DATE_PATTERN.test(day) && !Number.isNaN(dayStartMs(day)) && new Date(dayStartMs(day)).toISOString().startsWith(day);

const pad = (value: number): string => String(value).padStart(2, '0');

/**
 * The calendar day a picker shows, as `yyyy-MM-dd`. Read from the Date's own fields because the picker hands
 * back local midnight, and converting that to UTC would move the day for anyone east of Greenwich.
 */
export const formatCalendarDay = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const parseCalendarDay = (day: string): Date | null =>
  isCalendarDate(day) ? new Date(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10))) : null;

/** Today in UTC, not the reader's local date. */
export const getTodayUtc = (now: Date): string => now.toISOString().slice(0, 10);

export const getSpanInDays = (from: string, to: string): number =>
  Math.round((dayStartMs(to) - dayStartMs(from)) / MS_PER_DAY) + 1;

/** Why a range cannot be sent, or null. `maxDays` is passed only where the service has a limit. */
export const getBackfillRangeIssue = (
  from: string,
  to: string,
  today: string,
  maxDays?: number,
): BackfillRangeIssue | null => {
  if (!isCalendarDate(from) || !isCalendarDate(to)) return BackfillRangeIssue.Missing;
  // ISO dates compare correctly as strings.
  if (from > to) return BackfillRangeIssue.Inverted;
  if (to > today) return BackfillRangeIssue.InFuture;
  if (maxDays != null && getSpanInDays(from, to) > maxDays) return BackfillRangeIssue.TooLong;

  return null;
};

/**
 * The two moments the runner is sent for whole UTC days. Its lower bound is excluded and its upper included, so
 * the first day starts one millisecond after the lower bound. The version column has millisecond precision.
 */
export const getDayWindowMoments = (from: string, to: string): BackfillWindowMoments => ({
  from: new Date(dayStartMs(from) - 1).toISOString(),
  to: `${to}${LAST_MS_OF_DAY}`,
});

const dayOfLowerBound = (moment: string): string | null => {
  const next = Date.parse(moment) + 1;

  return next % MS_PER_DAY === 0 ? new Date(next).toISOString().slice(0, 10) : null;
};

const dayOfUpperBound = (moment: string): string | null => {
  const ms = Date.parse(moment);

  return (ms + 1) % MS_PER_DAY === 0 ? new Date(ms).toISOString().slice(0, 10) : null;
};

/**
 * The inverse of `getDayWindowMoments`. A bound off a day boundary (a run started elsewhere) is shown as the
 * moment it is.
 */
export const getWindowView = (from?: string | null, to?: string | null): BackfillWindowView => {
  if (!from && !to) return { kind: BackfillWindowKind.Everything };

  const fromDay = from ? dayOfLowerBound(from) : null;
  const toDay = to ? dayOfUpperBound(to) : null;
  const isFromWholeDay = !from || fromDay != null;
  const isToWholeDay = !to || toDay != null;

  if (isFromWholeDay && isToWholeDay) {
    return { kind: BackfillWindowKind.Days, from: fromDay ?? undefined, to: toDay ?? undefined };
  }

  return { kind: BackfillWindowKind.Moments, from: from ?? undefined, to: to ?? undefined };
};

export const isWindowUpToNow = (view: BackfillWindowView, today: string): boolean =>
  view.kind === BackfillWindowKind.Days && view.to === today;

/**
 * The range a re-run starts: from the earliest failed day through the end of the original range, or the whole
 * original range when the run named no failed day (it stopped before attempting any).
 *
 * Through the original end, not the last failed day: a run that stopped early names only the days it attempted,
 * so the days after the stop are named nowhere and only the original end covers them. The service skips what it
 * already holds, so covering more than the failed days costs nothing.
 */
export const getRerunRange = (run: Pick<TableBackfillRun, 'from' | 'to' | 'failedDates'>): BackfillRerunRange => ({
  from: run.failedDates?.length ? [...run.failedDates].sort()[0] : run.from,
  to: run.to,
});

/**
 * "Day N of M": the days the run has finished, plus the one it is working on. Never past the total.
 * A failed day counts as finished, so the number reaches the total on a run that ends with failures.
 */
export const getDaysProgress = (
  run: Pick<TableBackfillRun, 'daysCompleted' | 'daysFailed' | 'daysTotal' | 'state'>,
): number => {
  const finished = run.daysCompleted + run.daysFailed;

  return run.state === TableBackfillState.Running ? Math.min(finished + 1, run.daysTotal) : finished;
};

export const getTableBackfillStatus = (state: TableBackfillState): BackfillStatus => TABLE_BACKFILL_STATUS[state];

/**
 * A finished run of a group pipeline marked its groups and evaluated none, so it reads Queued rather than Done.
 * Whether the pipeline is group-triggered comes from its declaration, never from the run.
 */
export const getPipelineBackfillStatus = (state: PipelineBackfillState, isGroupTrigger: boolean): BackfillStatus =>
  state === PipelineBackfillState.Done && isGroupTrigger ? BackfillStatus.Queued : PIPELINE_BACKFILL_STATUS[state];

export const isPipelineBackfillActive = (run: Pick<PipelineBackfillRun, 'state'>): boolean =>
  run.state === PipelineBackfillState.Running || run.state === PipelineBackfillState.Paused;

/**
 * The banner announces a running run, or one paused for a reason of its own; a run paused with its pipeline is
 * left to the pipeline's banner.
 */
export const shouldShowPipelineBackfillBanner = (
  run: Pick<PipelineBackfillRun, 'state' | 'paused_reason'>,
): boolean => {
  if (run.state === PipelineBackfillState.Running) return true;
  if (run.state !== PipelineBackfillState.Paused) return false;

  return run.paused_reason == null || !PIPELINE_PAUSE_REASONS.has(run.paused_reason);
};

export const canRerunTableBackfill = (
  run: Pick<TableBackfillRun, 'state' | 'failedDates'>,
  isAnyRunInProgress: boolean,
): boolean =>
  !isAnyRunInProgress &&
  (run.state === TableBackfillState.Failed ||
    (run.state === TableBackfillState.Completed && Boolean(run.failedDates?.length)));

/** A run's window as a reader says it: Everything, whole days, or the exact moments a caller outside sent. */
export const formatBackfillWindow = (
  view: BackfillWindowView,
  today: string,
  t: (key: BackfillI18nKey, params?: Record<string, string>) => string,
): string => {
  if (view.kind === BackfillWindowKind.Everything) return t(BackfillI18nKey.Everything);

  const isMoments = view.kind === BackfillWindowKind.Moments;
  const from = isMoments && view.from ? formatDateTimeToLocalString(view.from) : view.from;
  const to = isMoments && view.to ? formatDateTimeToLocalString(view.to) : view.to;

  if (from && to) {
    return !isMoments && isWindowUpToNow(view, today)
      ? t(BackfillI18nKey.WindowUpToNow, { from })
      : t(BackfillI18nKey.WindowRange, { from, to });
  }

  if (to) return t(BackfillI18nKey.WindowUntil, { to });

  return t(BackfillI18nKey.WindowSince, { from: from ?? '' });
};
