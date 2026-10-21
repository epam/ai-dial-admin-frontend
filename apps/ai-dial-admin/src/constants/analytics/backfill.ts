import { BackfillI18nKey } from '@/src/constants/i18n';
import { BackfillStatus } from '@/src/models/analytics/backfill-ui';
import { PipelineBackfillPauseReason, PipelineBackfillState } from '@/src/models/analytics/pipeline-backfill';
import { TableBackfillState } from '@/src/models/analytics/table-backfill';

export const TABLE_BACKFILL_STATUS: Record<TableBackfillState, BackfillStatus> = {
  [TableBackfillState.Running]: BackfillStatus.Running,
  [TableBackfillState.Completed]: BackfillStatus.Done,
  [TableBackfillState.Failed]: BackfillStatus.Failed,
};

export const PIPELINE_BACKFILL_STATUS: Record<PipelineBackfillState, BackfillStatus> = {
  [PipelineBackfillState.Running]: BackfillStatus.Running,
  [PipelineBackfillState.Paused]: BackfillStatus.Paused,
  [PipelineBackfillState.Done]: BackfillStatus.Done,
  [PipelineBackfillState.Cancelled]: BackfillStatus.Cancelled,
};

/**
 * The pause reasons that are a consequence of the pipeline's own pause. The pipeline's banner already states
 * that pause, so a run paused for one of these gets no banner of its own.
 */
export const PIPELINE_PAUSE_REASONS: ReadonlySet<PipelineBackfillPauseReason> = new Set([
  PipelineBackfillPauseReason.PipelinePausedOperator,
  PipelineBackfillPauseReason.PipelinePausedBreaker,
]);

export const PIPELINE_PAUSE_REASON_MESSAGE: Record<PipelineBackfillPauseReason, BackfillI18nKey> = {
  [PipelineBackfillPauseReason.Operator]: BackfillI18nKey.PauseReasonOperator,
  [PipelineBackfillPauseReason.PipelinePausedOperator]: BackfillI18nKey.PauseReasonPipelinePausedOperator,
  [PipelineBackfillPauseReason.PipelinePausedBreaker]: BackfillI18nKey.PauseReasonPipelinePausedBreaker,
  [PipelineBackfillPauseReason.SpendBudgetExhausted]: BackfillI18nKey.PauseReasonSpendBudgetExhausted,
  [PipelineBackfillPauseReason.CursorStalled]: BackfillI18nKey.PauseReasonCursorStalled,
  [PipelineBackfillPauseReason.PipelineAbsent]: BackfillI18nKey.PauseReasonPipelineAbsent,
  [PipelineBackfillPauseReason.PipelineChanged]: BackfillI18nKey.PauseReasonPipelineChanged,
};

/**
 * The longest range, in days, the ingest service accepts by default. It is configurable there, so this changes
 * together with the service's default; the service's own refusal is the backstop when the two drift.
 */
export const TABLE_BACKFILL_MAX_DAYS = 366;

export const BACKFILL_POLL_INTERVAL_MS = 5_000;

/** How many runs the pipeline drawer asks for; the listing has no page after this one. */
export const PIPELINE_BACKFILL_LIST_LIMIT = 10;

export const MS_PER_DAY = 86_400_000;

/** Wider than the permissions drawer's 460px, so the rows of three figures fit. */
export const BACKFILL_DRAWER_CLASS = 'w-[600px]';
