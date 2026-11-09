import {
  IngestFailure,
  IngestFailureKind,
  IngestFailureList,
  IngestFailureReason,
  IngestFailureState,
  IngestRetrySweep,
} from '@/src/models/analytics/ingest-failure';

export const SWEEP: IngestRetrySweep = { enabled: true, next_sweep_at: '2026-11-05T10:15:00Z', max_per_sweep: 500 };

export const ingestFailure = (overrides: Partial<IngestFailure> = {}): IngestFailure => ({
  kind: IngestFailureKind.Blob,
  subject: 'logs/2026/11/04/a.log.gz',
  day: '2026-11-04',
  state: IngestFailureState.Parked,
  reason: IngestFailureReason.MappingError,
  message: 'bad line',
  path: 'poll',
  attempts: 1,
  first_failed_at: '2026-11-04T08:00:00Z',
  last_failed_at: '2026-11-04T09:00:00Z',
  ...overrides,
});

export const ingestList = (
  failures: IngestFailure[],
  overrides: Partial<IngestFailureList> = {},
): IngestFailureList => ({
  failures,
  truncated: false,
  total: failures.length,
  by_state: { pending: 0, parked: failures.length },
  retry_sweep: SWEEP,
  ...overrides,
});
