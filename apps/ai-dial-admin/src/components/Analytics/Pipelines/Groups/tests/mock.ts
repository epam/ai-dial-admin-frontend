import { PipelineGroup } from '@/src/models/analytics/pipeline-groups';

/** 2026-10-05T12:00:00Z — every fixture is placed relative to it. */
export const NOW = Date.parse('2026-10-05T12:00:00Z');
export const TODAY = '2026-10-05';

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;

export const isoAgo = (ms: number): string => new Date(NOW - ms).toISOString();

export const groupMock = (overrides: Partial<PipelineGroup> = {}): PipelineGroup => ({
  group_key: 'sess_A',
  group_version: NOW - 2 * MINUTE,
  last_activity_at: isoAgo(2 * MINUTE),
  signalled: false,
  computed_version: null,
  computed_at: null,
  computed_truncated: false,
  evaluations_day: TODAY,
  evaluations: 0,
  dirty: true,
  ...overrides,
});
