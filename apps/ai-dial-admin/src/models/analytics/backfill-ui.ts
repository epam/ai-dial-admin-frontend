/**
 * What the console says about a backfill run, in one vocabulary across both upstreams.
 *
 * The services spell their states differently — the ingest service's `completed` and the runner's `done` mean the
 * same thing — so the console maps each onto this set rather than showing either spelling.
 */
export enum BackfillStatus {
  Running = 'running',
  Paused = 'paused',
  Done = 'done',
  /** A group pipeline's finished run: the window is marked, and evaluation follows on the pipeline's schedule. */
  Queued = 'queued',
  Cancelled = 'cancelled',
  Failed = 'failed',
}

/** How a measure of a run is coloured: what went through, and what did not. Anything else stays the text colour. */
export enum BackfillTone {
  Success = 'success',
  Error = 'error',
}

/** Why a start form's range cannot be sent. At most one is reported, in this order. */
export enum BackfillRangeIssue {
  Missing = 'missing',
  Inverted = 'inverted',
  InFuture = 'in-future',
  TooLong = 'too-long',
}

/** How a pipeline run's window reads: no window, whole UTC days, or exact moments set outside the console. */
export enum BackfillWindowKind {
  Everything = 'everything',
  Days = 'days',
  Moments = 'moments',
}

export interface BackfillWindowView {
  kind: BackfillWindowKind;
  /** `yyyy-MM-dd` for days, an ISO moment for moments. Absent for everything and for an open bound. */
  from?: string;
  to?: string;
}

export interface BackfillWindowMoments {
  from: string;
  to: string;
}

/** The range a re-run starts. `to` is the last day of the original range, never the last failed day. */
export interface BackfillRerunRange {
  from: string;
  to: string;
}
