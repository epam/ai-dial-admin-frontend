/**
 * The analytics data service's ingest backfill: raw logs for a range of UTC days re-ingested into the source
 * tables. One run at a time per service instance; it has no pause and no cancel.
 */

/** The run's state in the service's own spelling. `failed` is an early stop, not a count of failed days. */
export enum TableBackfillState {
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
}

/**
 * Two inclusive UTC dates, `yyyy-MM-dd`. `includeIngested` is always sent as `false`: the console never
 * re-ingests what the service already holds.
 */
export interface TableBackfillRequest {
  from: string;
  to: string;
  includeIngested: boolean;
}

export interface TableBackfillStart {
  runId: string;
  from: string;
  to: string;
  days: number;
}

/**
 * Members the service has nothing for are left out of the body, not sent as null; `failedDates` is absent,
 * not empty, when no day failed.
 */
export interface TableBackfillRun {
  runId: string;
  from: string;
  to: string;
  daysTotal: number;
  state: TableBackfillState;
  currentDate?: string | null;
  /** Days ingested successfully. A failed day is counted in `daysFailed`, not here. */
  daysCompleted: number;
  daysFailed: number;
  /** Ascending `yyyy-MM-dd`. Names only the days the run attempted, never the ones it did not reach. */
  failedDates?: string[] | null;
  filesProcessed: number;
  rowsInserted: number;
  /** Lines that could not be parsed. Not a failure. */
  rowsSkipped: number;
  /** Rows with no deduplication key. Not a failure. */
  rowsDropped: number;
  startedAt: string;
  finishedAt?: string | null;
}

/** The retained runs, newest started first. `runs` is always present; no match is an empty list. */
export interface TableBackfillRunsResponse {
  runs: TableBackfillRun[];
}
