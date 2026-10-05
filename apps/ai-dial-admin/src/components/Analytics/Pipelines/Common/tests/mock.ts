import { vi } from 'vitest';

import { PipelineRuntimeViewRead } from '@/src/components/Analytics/Pipelines/Common/use-pipeline-runtime-view';
import {
  PipelineLane,
  PipelineRuntimeState,
  PipelineRuntimeView,
  RuntimeReadOutcome,
} from '@/src/models/analytics/pipeline-runtime';

/**
 * A row-lane view with every section the lane carries.
 *
 * Defaults to the shape a healthy model-calling enrichment answers with, so a test names only the
 * member it is about. A test about an omitted section passes `undefined` for it explicitly — which is
 * the case worth being explicit about, since absence is what the tab reads as "this lane has none".
 */
export const runtimeView = (overrides: Partial<PipelineRuntimeView> = {}): PipelineRuntimeView => ({
  pipeline_name: 'feedback-live',
  lane: PipelineLane.Row,
  generation: 7,
  status: { state: PipelineRuntimeState.Active },
  schedule: {
    last_scan_at: '2026-10-05T10:00:00Z',
    next_run_at: '2026-10-05T10:05:00Z',
    running_now: false,
    consecutive_failures: 0,
  },
  progress: { lag_seconds: 38, has_more: true, last_write_at: '2026-10-05T09:59:00Z' },
  queue: { computing: 4, awaiting_write: 2 },
  spend_today: { calls: 120, tokens: 48000, failed_calls: 3 },
  failures: { total: 0, requeueable_total: 0 },
  ...overrides,
});

/**
 * The hook's answer. Defaults to a view that was read; a test about one of the other outcomes names
 * that outcome, and `view` is dropped for every outcome but `Read`.
 */
export const runtimeRead = (overrides: Partial<PipelineRuntimeViewRead> = {}): PipelineRuntimeViewRead => {
  const outcome = overrides.outcome ?? RuntimeReadOutcome.Read;

  return {
    outcome,
    view: outcome === RuntimeReadOutcome.Read ? runtimeView() : undefined,
    reload: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
};

/** No runner at all: what an aggregate pipeline and an unconfigured host both look like. */
export const noRuntimeRead = (overrides: Partial<PipelineRuntimeViewRead> = {}): PipelineRuntimeViewRead =>
  runtimeRead({ outcome: RuntimeReadOutcome.Unavailable, ...overrides });
