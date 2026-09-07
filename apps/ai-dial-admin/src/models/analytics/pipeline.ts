import { Evaluator, EvaluatorType } from '@/src/models/analytics/evaluator';

export enum PipelineKind {
  Enrich = 'enrich',
  Aggregate = 'aggregate',
}

export enum TriggerKind {
  OnIngest = 'on_ingest',
  Schedule = 'schedule',
  Group = 'group',
}

export enum PipelinePriority {
  Live = 'live',
  Backfill = 'backfill',
}

export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc',
}

export enum PipelineEnabledFilter {
  All = 'all',
  Enabled = 'enabled',
  Disabled = 'disabled',
}

export enum TruncUnit {
  Hour = 'hour',
  Day = 'day',
  Week = 'week',
  Month = 'month',
}

export enum FreshnessMode {
  Periodic = 'periodic',
  Incremental = 'incremental',
}

export interface PipelinesListFilters {
  kind?: PipelineKind;
  enabled?: PipelineEnabledFilter;
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

export interface PipelineTrigger {
  kind: TriggerKind;
  cron?: string;
  group_by?: string;
  ready_when?: ReadyWhen;
  member_select?: MemberSelect;
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

export interface TruncSpec {
  column: string;
  unit: TruncUnit;
}

export interface GroupKey {
  column?: string;
  trunc?: TruncSpec;
  as?: string;
}

export interface Measure {
  name: string;
  fn: string;
  column?: string;
  where?: string;
  distinct?: boolean;
}

export interface Freshness {
  mode: FreshnessMode;
}

export interface PipelineClamp {
  enrichment: string;
  cursor_version?: number;
  cursor_identity?: string;
}

export interface PipelineUnclampedRead {
  enrichment: string;
  reason: string;
}

export interface PipelineRebuildRequired {
  enrichment: string;
  rederived_at: string;
}

export interface PipelineState {
  cursor_version?: number;
  cursor_identity?: string;
  lag_seconds?: number;
  last_run_at?: string;
  next_run_at?: string;
  last_error?: string;
  has_more?: boolean;
  clamp?: PipelineClamp;
  unclamped_reads?: PipelineUnclampedRead[];
  rebuild_required?: PipelineRebuildRequired;
  materialized_through_version?: number;
  materialized_through_identity?: string;
  drained_at?: string;
}

export interface CreatePipelineDto {
  name: string;
  kind: PipelineKind;
  target: string;
  inputs?: string[];
  filter?: string;
  trigger: PipelineTrigger;
  enabled?: boolean;
  evaluator_name?: string;
  evaluator_version?: number;
  input_bindings?: InputBinding[];
  output_bindings?: OutputBinding[];
  sampling?: number;
  cadence?: string;
  batch_scan_limit?: number;
  batch_chunk?: number;
  rate_rpm?: number;
  priority?: PipelinePriority;
  group_by?: GroupKey[];
  measures?: Measure[];
  freshness?: Freshness;
}

export interface Pipeline extends Omit<CreatePipelineDto, 'enabled'> {
  enabled: boolean;
  generation: number;
  created_at: string;
  updated_at: string;
  state?: PipelineState;
  evaluator?: Evaluator;
  grain_key?: string;
  version_column?: string;
}

export interface PipelineEvaluatorSummary {
  name: string;
  version: number;
  type: EvaluatorType;
}

export interface PipelineListItem {
  name: string;
  kind: PipelineKind;
  target: string;
  inputs?: string[];
  trigger: PipelineTrigger;
  enabled: boolean;
  generation: number;
  updated_at: string;
  evaluator_name?: string;
  evaluator_version?: number;
  evaluator?: PipelineEvaluatorSummary;
  grain_key?: string;
  version_column?: string;
}

export interface PipelineReadResult<T> {
  data: T | null;
  isForbidden: boolean;
}
