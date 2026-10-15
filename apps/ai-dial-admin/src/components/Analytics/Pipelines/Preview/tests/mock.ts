import { Pipeline, PipelineKind, TransformType, TriggerKind } from '@/src/models/analytics/pipeline';
import {
  PipelinePreview,
  PreviewColumn,
  PreviewColumnRole,
  PreviewNote,
  PreviewNoteCode,
  PreviewNoteSeverity,
} from '@/src/models/analytics/pipeline-preview';

const pipelineBase = {
  name: 'chat-cost-tier',
  target: 'chat_cost',
  inputs: ['dial_usage_log'],
  enabled: false,
  generation: 6,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-02-01T00:00:00Z',
};

/** A disabled SQL enrichment with no filter: the plainest pipeline a preview runs on. */
export const sqlPipeline = (overrides: Partial<Pipeline> = {}): Pipeline => ({
  ...pipelineBase,
  kind: PipelineKind.Enrich,
  trigger: { kind: TriggerKind.Schedule },
  transform: { type: TransformType.Sql, outputs: { cost_tier: 'multiIf(cost > 1, 1, 0)' } },
  ...overrides,
});

export const aggregatePipeline = (overrides: Partial<Pipeline> = {}): Pipeline => ({
  ...pipelineBase,
  kind: PipelineKind.Aggregate,
  trigger: { kind: TriggerKind.Schedule, cron: '0 */15 * * * *' },
  group_by: [{ column: 'chat_id' }],
  measures: [{ name: 'requests', fn: 'count' }],
  ...overrides,
});

export const llmPipeline = (overrides: Partial<Pipeline> = {}): Pipeline => ({
  ...pipelineBase,
  kind: PipelineKind.Enrich,
  trigger: { kind: TriggerKind.Schedule },
  transform: {
    type: TransformType.Llm,
    outputs: { sentiment: 'How the user felt', topic: { prose: 'The subject of the chat' }, risk: null },
  },
  ...overrides,
});

export const llmGroupPipeline = (overrides: Partial<Pipeline> = {}): Pipeline =>
  llmPipeline({ trigger: { kind: TriggerKind.Group, group_by: 'conversation_id' }, ...overrides });

export const columnMock = (overrides: Partial<PreviewColumn> = {}): PreviewColumn => ({
  name: 'event_id',
  role: PreviewColumnRole.GrainKey,
  type: 'string',
  ...overrides,
});

export const noteMock = (overrides: Partial<PreviewNote> = {}): PreviewNote => ({
  code: PreviewNoteCode.EnrichmentBehind,
  severity: PreviewNoteSeverity.Info,
  message: 'Matching input reaches 15:11:30.',
  ...overrides,
});

/** An SQL preview of two rows; a test about another kind overrides the members that kind differs in. */
export const previewMock = (overrides: Partial<PipelinePreview> = {}): PipelinePreview => ({
  statement: 'SELECT event_id, cost_tier FROM dial_usage_log LIMIT 5',
  columns: [
    columnMock(),
    columnMock({ name: 'cost_tier', role: PreviewColumnRole.Output, type: 'string', target_type: 'string' }),
  ],
  rows: [
    { event_id: 'a1', cost_tier: 'mid' },
    { event_id: 'b2', cost_tier: null },
  ],
  notes: [],
  ...overrides,
});
