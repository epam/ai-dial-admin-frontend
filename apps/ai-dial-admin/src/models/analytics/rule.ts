import { Evaluator, EvaluatorType } from '@/src/models/analytics/evaluator';

export enum TriggerKind {
  OnIngest = 'on_ingest',
  Schedule = 'schedule',
  Group = 'group',
}

export enum RulePriority {
  Live = 'live',
  Backfill = 'backfill',
}

export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc',
}

export enum RuleEnabledFilter {
  All = 'all',
  Enabled = 'enabled',
  Disabled = 'disabled',
}

export interface RulesListFilters {
  enabled: RuleEnabledFilter;
  updatedSince?: string;
}

export interface ReadyWhen {
  signal?: string;
  idle?: string;
  max_staleness?: string;
  cost_ceiling?: number;
}

export interface MemberSelectOrderBy {
  column: string;
  direction: SortDirection;
}

export interface MemberSelect {
  prefer_sql?: string;
  order_by?: MemberSelectOrderBy[];
  limit: number;
}

export interface InputBinding {
  var: string;
  column?: string;
  jsonata?: string;
}

export interface OutputBinding {
  column: string;
  var: string;
}

export interface CreateRuleDto {
  name: string;
  evaluator_name: string;
  evaluator_version?: number;
  target_enrichment: string;
  trigger_kind: TriggerKind;
  enabled: boolean;
  trigger_cron?: string;
  group_by?: string;
  ready_when?: ReadyWhen;
  member_select?: MemberSelect;
  source?: string;
  filter_sql?: string;
  input_bindings?: InputBinding[];
  output_bindings?: OutputBinding[];
  sampling?: number;
  cadence?: string;
  batch_scan_limit?: number;
  batch_chunk?: number;
  rate_rpm?: number;
  priority?: RulePriority;
}

export interface EnrichmentRule extends Omit<CreateRuleDto, 'enabled'> {
  id: string;
  enabled: boolean;
  evaluator: Evaluator;
  grain_key: string;
  version_column?: string;
  generation: number;
  created_at: string;
  updated_at: string;
}

export interface EnrichmentRuleEvaluatorSummary {
  name: string;
  version: number;
  type: EvaluatorType;
}

export interface EnrichmentRuleListItem {
  id: string;
  name: string;
  evaluator_name: string;
  evaluator_version?: number;
  evaluator: EnrichmentRuleEvaluatorSummary;
  target_enrichment: string;
  source?: string;
  grain_key: string;
  version_column?: string;
  trigger_kind: TriggerKind;
  trigger_cron?: string;
  group_by?: string;
  enabled: boolean;
  generation: number;
  updated_at: string;
}
