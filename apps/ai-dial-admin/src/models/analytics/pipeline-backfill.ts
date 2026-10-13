/**
 * The enrichment runner's backfill of one pipeline: its history re-driven on its own cursor. At most one run is
 * running per pipeline; any number may be paused.
 */

/** The run's state in the runner's own spelling. There is deliberately no failed state. */
export enum PipelineBackfillState {
  Running = 'running',
  Paused = 'paused',
  Done = 'done',
  Cancelled = 'cancelled',
}

export enum PipelineBackfillVerb {
  Pause = 'pause',
  Resume = 'resume',
  Cancel = 'cancel',
}

/** Why a run is paused. Present exactly while the run is paused. */
export enum PipelineBackfillPauseReason {
  Operator = 'operator',
  PipelinePausedOperator = 'pipeline_paused_operator',
  PipelinePausedBreaker = 'pipeline_paused_breaker',
  SpendBudgetExhausted = 'spend_budget_exhausted',
  CursorStalled = 'cursor_stalled',
  PipelineAbsent = 'pipeline_absent',
  PipelineChanged = 'pipeline_changed',
}

/**
 * What the console sends to start a run. The runner takes both members absent as a full replay; the console
 * always sends a bounded window.
 *
 * The window is `(from, to]` on the source's version column: `from` excluded, `to` included, both ISO moments.
 */
export interface PipelineBackfillRequest {
  from?: string;
  to?: string;
}

/**
 * A run as the runner reports it, by the single-run read, the listing and every verb alike.
 *
 * Every member the runner omits is optional. There is no total: `rows_done` is the rows processed so far, and
 * no percentage can be derived from it. `window_to` is the bound the caller sent, not the one the service
 * enforced — the service clamps it on every page without writing the clamp back.
 */
export interface PipelineBackfillRun {
  id: string;
  pipeline_name: string;
  /** The run's kind in the runner's history (live, backfill, schedule) — not the pipeline's trigger. */
  kind: string;
  state: PipelineBackfillState;
  paused_reason?: PipelineBackfillPauseReason | null;
  paused_at?: string | null;
  rows_done: number;
  /** A classification of why the last batch failed, cleared by the next page that commits. */
  last_error?: string | null;
  last_error_at?: string | null;
  /** Absent for a full replay. */
  window_from?: string | null;
  window_to?: string | null;
  started_at: string;
  finished_at?: string | null;
}

/** The runs matching the listing's filters, newest started first. No total and no further page. */
export interface PipelineBackfillRunsResponse {
  runs: PipelineBackfillRun[];
}
