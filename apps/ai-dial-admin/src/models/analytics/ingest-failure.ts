/**
 * The analytics data service's failure ledger for the system tables' own ingest: blobs and days that failed
 * to load. Resolved failures are not listed. Members the service has nothing for are left out of the body.
 */

export enum IngestFailureKind {
  Blob = 'blob',
  Day = 'day',
  Records = 'records',
}

export enum IngestFailureState {
  /** Retried by the service on its own, with backoff. */
  Pending = 'pending',
  /** Waits for an operator's retry. */
  Parked = 'parked',
}

export enum IngestFailureClass {
  Transient = 'transient',
  Deterministic = 'deterministic',
}

export enum IngestFailureReason {
  CorruptGzip = 'corrupt_gzip',
  MappingError = 'mapping_error',
  BlobMissing = 'blob_missing',
  RejectedByServer = 'rejected_by_server',
  SkippedRecords = 'skipped_records',
  ReadError = 'read_error',
  ListingFailed = 'listing_failed',
  PrepareFailed = 'prepare_failed',
  WriteFailed = 'write_failed',
  StorageFull = 'storage_full',
}

export enum IngestFailurePath {
  Poll = 'poll',
  Reconcile = 'reconcile',
  Backfill = 'backfill',
  Retry = 'retry',
}

export interface IngestFailure {
  kind: IngestFailureKind;
  /** A blob's full key or a day's ISO date. A `records` failure carries its blob's key. */
  subject: string;
  day: string;
  blob_last_modified?: string;
  state: IngestFailureState;
  failure_class?: IngestFailureClass;
  /** Typed as a string: the service may add a reason the console does not know yet. */
  reason: string;
  message?: string;
  path?: string;
  attempts: number;
  first_failed_at: string;
  last_failed_at: string;
  next_attempt_at?: string;
  backfill_run_ids?: string[];
}

export interface IngestFailureByState {
  pending: number;
  parked: number;
}

export interface IngestRetrySweep {
  enabled: boolean;
  next_sweep_at?: string;
  max_per_sweep: number;
}

export interface IngestFailureFilters {
  state?: IngestFailureState;
  kind?: IngestFailureKind;
  reason?: string;
  backfill_run_id?: string;
  limit?: number;
}

export interface IngestFailureList {
  failures: IngestFailure[];
  truncated: boolean;
  total: number;
  by_state: IngestFailureByState;
  retry_sweep: IngestRetrySweep;
}

export interface IngestFailureTarget {
  kind: IngestFailureKind;
  subject: string;
}

export interface IngestFailureRetryRequest {
  state?: IngestFailureState;
  kind?: IngestFailureKind;
  reason?: string;
  backfill_run_id?: string;
  targets?: IngestFailureTarget[];
}

export interface IngestFailureRetryResult {
  requeued: number;
  retry_sweep: IngestRetrySweep;
}
