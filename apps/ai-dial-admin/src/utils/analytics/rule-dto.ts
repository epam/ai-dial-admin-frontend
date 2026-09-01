import { RuleDraft, SourceMode } from '@/src/models/analytics/enrichment-rules-ui';
import { trimmedString } from '@/src/utils/formatting/trimmed-string';
import { CreateRuleDto, EnrichmentRule, ReadyWhen, TriggerKind } from '@/src/models/analytics/rule';

interface Context {
  grainKey?: string;
  sourceTable?: string;
}

// Members the service derives and the API rejects on write; typed against the rule so a rename fails here.
const READ_ONLY_MEMBERS: (keyof EnrichmentRule)[] = [
  'id',
  'evaluator',
  'grain_key',
  'version_column',
  'generation',
  'created_at',
  'updated_at',
];

export const getReadOnlyMembers = (): string[] => [...READ_ONLY_MEMBERS];

export const toRuleDraft = (rule: EnrichmentRule): RuleDraft => {
  const draft = { ...rule } as RuleDraft & Record<string, unknown>;
  READ_ONLY_MEMBERS.forEach((key) => delete draft[key]);
  return draft;
};

// Rebuilt from the selected kind on every save rather than carried over: the service rejects a member
// belonging to another trigger kind with 422 instead of ignoring it.
const TRIGGER_OWNED_MEMBERS: (keyof CreateRuleDto)[] = ['trigger_cron', 'group_by', 'ready_when', 'member_select'];

/**
 * Assembles the rule to send. Everything on the draft is carried through — including members no control
 * presents, which is what stops a full-replace PUT from erasing them — except:
 *
 * - read-only members, which the API rejects;
 * - the trigger-owned members, which are constructed from the selected kind;
 * - `source`, which is omitted when the rule follows its target enrichment (see `getSourceMode`);
 * - empty optional members, which are dropped rather than sent as blank or zero.
 */
export const buildRuleDto = (draft: RuleDraft, { grainKey, sourceTable }: Context = {}): CreateRuleDto => {
  const dto = { ...draft } as CreateRuleDto & Record<string, unknown>;

  READ_ONLY_MEMBERS.forEach((key) => delete dto[key]);
  TRIGGER_OWNED_MEMBERS.forEach((key) => delete dto[key]);

  dto.name = trimmedString(draft.name);

  if (draft.trigger_kind === TriggerKind.Schedule && trimmedString(draft.trigger_cron)) {
    dto.trigger_cron = trimmedString(draft.trigger_cron);
  }

  if (draft.trigger_kind === TriggerKind.Group) {
    dto.group_by = grainKey;

    const readyWhen = compactReadyWhen(draft.ready_when);
    if (readyWhen) dto.ready_when = readyWhen;

    if (draft.member_select?.limit) {
      dto.member_select = {
        limit: draft.member_select.limit,
        ...(trimmedString(draft.member_select.prefer_sql)
          ? { prefer_sql: trimmedString(draft.member_select.prefer_sql) }
          : {}),
        ...(Array.isArray(draft.member_select.order_by) && draft.member_select.order_by.length
          ? { order_by: draft.member_select.order_by }
          : {}),
      };
    }
  }

  if (getSourceMode(draft.source, sourceTable) === SourceMode.Follow) {
    delete dto.source;
  }

  dropEmptyMembers(dto);

  return dto;
};

/**
 * The service resolves a declared `source` and a defaulted one into the same response, so a rule that follows
 * its target enrichment is indistinguishable from one pinned to the same table. Equality with the target's
 * `source_table` is read as following — wrong only for a deliberate pin of the already-default table, which
 * this silently un-pins. Omitting `source` is the only way to say "follow".
 */
export const getSourceMode = (source?: string, sourceTable?: string): SourceMode =>
  !source || source === sourceTable ? SourceMode.Follow : SourceMode.Pin;

const compactReadyWhen = (readyWhen?: ReadyWhen): ReadyWhen | undefined => {
  if (!readyWhen || typeof readyWhen !== 'object') return undefined;

  const next: ReadyWhen = {};
  if (trimmedString(readyWhen.signal)) next.signal = trimmedString(readyWhen.signal);
  if (readyWhen.idle) next.idle = readyWhen.idle;
  if (readyWhen.max_staleness) next.max_staleness = readyWhen.max_staleness;
  if (readyWhen.cost_ceiling) next.cost_ceiling = readyWhen.cost_ceiling;

  return Object.keys(next).length ? next : undefined;
};

// A cleared knob must vanish rather than arrive as `0` or `''` — zero is a meaningful value for several.
const dropEmptyMembers = (dto: Record<string, unknown>): void => {
  Object.keys(dto).forEach((key) => {
    const value = dto[key];
    const isEmpty = value == null || value === '' || (Array.isArray(value) && value.length === 0);
    if (isEmpty) delete dto[key];
  });
};
