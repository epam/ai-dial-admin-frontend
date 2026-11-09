import { IngestFailure, IngestFailureKind, IngestFailureTarget } from '@/src/models/analytics/ingest-failure';

export interface IngestFailureGroup {
  key: string;
  reason: string;
  kind: IngestFailureKind;
  failures: IngestFailure[];
  newestAt: string;
}

export enum RetryOutcomeNote {
  NextPass = 'nextPass',
  SeveralPasses = 'severalPasses',
  SeveralPassesUntimed = 'severalPassesUntimed',
  SweepOff = 'sweepOff',
}

export enum IngestFailureRowType {
  Group = 'group',
  Failure = 'failure',
  Detail = 'detail',
}

export interface IngestFailureRow {
  rowId: string;
  type: IngestFailureRowType;
  group: IngestFailureGroup;
  failure?: IngestFailure;
}

export interface PendingIngestRetry {
  group?: IngestFailureGroup;
  targets?: IngestFailureTarget[];
  count?: number | null;
  isDeterministic: boolean;
}

export interface IngestFailuresDrawerState {
  backfillRunId?: string;
}
