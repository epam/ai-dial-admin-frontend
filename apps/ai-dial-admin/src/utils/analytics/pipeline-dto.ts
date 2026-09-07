import { PipelineDraft, SourceMode } from '@/src/models/analytics/pipeline-ui';
import { trimmedString } from '@/src/utils/formatting/trimmed-string';
import {
  CreatePipelineDto,
  MemberSelect,
  Pipeline,
  PipelineKind,
  PipelineTrigger,
  ReadyWhen,
  TriggerKind,
} from '@/src/models/analytics/pipeline';

interface Context {
  grainKey?: string;
  sourceTable?: string;
}

const READ_ONLY_MEMBERS: (keyof Pipeline)[] = [
  'evaluator',
  'grain_key',
  'version_column',
  'generation',
  'created_at',
  'updated_at',
  'state',
];

const ENRICH_ONLY_MEMBERS: (keyof CreatePipelineDto)[] = [
  'evaluator_name',
  'evaluator_version',
  'input_bindings',
  'output_bindings',
  'sampling',
  'cadence',
  'batch_scan_limit',
  'batch_chunk',
  'rate_rpm',
  'priority',
];

const AGGREGATE_ONLY_MEMBERS: (keyof CreatePipelineDto)[] = ['group_by', 'measures', 'freshness'];

export const getReadOnlyMembers = (): string[] => [...READ_ONLY_MEMBERS];

export const toPipelineDraft = (pipeline: Pipeline): PipelineDraft => {
  const draft = { ...pipeline } as PipelineDraft & Record<string, unknown>;
  READ_ONLY_MEMBERS.forEach((key) => delete draft[key]);
  return draft;
};

const membersOfOtherKind = (kind?: PipelineKind): (keyof CreatePipelineDto)[] =>
  kind === PipelineKind.Aggregate ? ENRICH_ONLY_MEMBERS : AGGREGATE_ONLY_MEMBERS;

export const buildPipelineDto = (draft: PipelineDraft, { grainKey, sourceTable }: Context = {}): CreatePipelineDto => {
  const dto = { ...draft } as CreatePipelineDto & Record<string, unknown>;

  READ_ONLY_MEMBERS.forEach((key) => delete dto[key]);
  membersOfOtherKind(draft.kind).forEach((key) => delete dto[key]);

  dto.name = trimmedString(draft.name);
  dto.trigger = buildTrigger(draft, grainKey);

  if (draft.kind !== PipelineKind.Aggregate && getSourceMode(draft.inputs, sourceTable) === SourceMode.Follow) {
    delete dto.inputs;
  }

  dropEmptyMembers(dto);

  return dto;
};

const buildTrigger = (draft: PipelineDraft, grainKey?: string): PipelineTrigger => {
  const kind = draft.kind === PipelineKind.Aggregate ? TriggerKind.Schedule : (draft.trigger?.kind as TriggerKind);
  const trigger: PipelineTrigger = { kind };

  if (kind === TriggerKind.Schedule) {
    const cron = trimmedString(draft.trigger?.cron);
    if (cron) trigger.cron = cron;
  }

  if (kind === TriggerKind.Group) {
    trigger.group_by = grainKey;

    const readyWhen = compactReadyWhen(draft.trigger?.ready_when);
    if (readyWhen) trigger.ready_when = readyWhen;

    const memberSelect = compactMemberSelect(draft.trigger?.member_select);
    if (memberSelect) trigger.member_select = memberSelect;
  }

  return trigger;
};

export const getPipelineInput = (inputs?: string[]): string | undefined => inputs?.[0];

export const getSourceMode = (inputs?: string[], sourceTable?: string): SourceMode => {
  const input = getPipelineInput(inputs);
  return !input || input === sourceTable ? SourceMode.Follow : SourceMode.Pin;
};

const compactReadyWhen = (readyWhen?: ReadyWhen): ReadyWhen | undefined => {
  if (!readyWhen || typeof readyWhen !== 'object') return undefined;

  const next: ReadyWhen = {};
  if (trimmedString(readyWhen.signal)) next.signal = trimmedString(readyWhen.signal);
  if (readyWhen.idle) next.idle = readyWhen.idle;
  if (readyWhen.max_staleness) next.max_staleness = readyWhen.max_staleness;
  if (readyWhen.cost_ceiling) next.cost_ceiling = readyWhen.cost_ceiling;

  return Object.keys(next).length ? next : undefined;
};

const compactMemberSelect = (memberSelect?: MemberSelect): MemberSelect | undefined => {
  if (!memberSelect?.limit) return undefined;

  return {
    limit: memberSelect.limit,
    ...(trimmedString(memberSelect.prefer_sql) ? { prefer_sql: trimmedString(memberSelect.prefer_sql) } : {}),
    ...(memberSelect.order_by?.length ? { order_by: memberSelect.order_by } : {}),
  };
};

// A cleared knob must vanish rather than arrive as `0` or `''` — zero is a meaningful value for several.
const dropEmptyMembers = (dto: Record<string, unknown>): void => {
  Object.keys(dto).forEach((key) => {
    const value = dto[key];
    const isEmpty = value == null || value === '' || (Array.isArray(value) && value.length === 0);
    if (isEmpty) delete dto[key];
  });
};
