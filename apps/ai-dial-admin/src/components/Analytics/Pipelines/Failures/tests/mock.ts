import { vi } from 'vitest';

import { PipelineFailuresRead } from '@/src/components/Analytics/Pipelines/Failures/use-pipeline-failures';
import { DlqItem, DlqStage } from '@/src/models/analytics/pipeline-dlq';
import { Pipeline, PipelineKind, TransformType, TriggerKind } from '@/src/models/analytics/pipeline';

export const PIPELINE: Pipeline = {
  name: 'usage-client-identity-live',
  kind: PipelineKind.Enrich,
  transform: { type: TransformType.Llm },
  target: 'usage_client_identity',
  trigger: { kind: TriggerKind.OnIngest },
  enabled: true,
  generation: 7,
  created_at: '2026-08-24T20:27:08Z',
  updated_at: '2026-09-16T00:21:12Z',
};

export const dlqItem = (overrides: Partial<DlqItem> = {}): DlqItem => ({
  id: 1,
  pipeline_name: PIPELINE.name,
  grain_key: null,
  pipeline_generation: 7,
  stage: DlqStage.DialCall,
  error: 'rate limit is exceeded',
  run_id: null,
  requeueable: true,
  created_at: '2026-10-02T10:00:00Z',
  ...overrides,
});

/**
 * A read of the failures, with the counts the service would have answered for the rows given.
 *
 * Defaulting the counters off `items` keeps a test that only names rows honest about them; a test
 * about a paged listing names `counts` itself, which is the case the two genuinely differ in.
 */
export const failuresRead = (overrides: Partial<PipelineFailuresRead> = {}): PipelineFailuresRead => {
  const items = overrides.items ?? [];

  return {
    counts: {
      total: items.length,
      retryable: items.filter((item) => item.requeueable).length,
      notRetryable: items.filter((item) => !item.requeueable).length,
    },
    newestAt: items[0]?.created_at,
    items,
    hasMore: false,
    isLoading: false,
    isLoadingMore: false,
    hasFailed: false,
    isUnavailable: false,
    filters: {},
    setLane: vi.fn(),
    setRun: vi.fn(),
    loadMore: vi.fn().mockResolvedValue(undefined),
    reload: vi.fn().mockResolvedValue(undefined),
    readRunRetryable: vi.fn().mockResolvedValue(0),
    ...overrides,
  };
};
