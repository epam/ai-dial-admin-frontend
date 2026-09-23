export enum PipelineKind {
  Enrich = 'enrich',
  Aggregate = 'aggregate',
}

export enum TriggerKind {
  OnIngest = 'on_ingest',
  Schedule = 'schedule',
  Group = 'group',
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

/**
 * Which projection a read returns. `Source` is the service's default and omits every resolved member;
 * `Compiled` is that same declaration plus what the service derived. `Compiled` resolves for
 * `PipelineKind.Enrich` alone — the service refuses it for a cross-kind listing and for a single read of
 * any other kind — so a read names it only where it is served, never unconditionally.
 */
export enum PipelineView {
  Source = 'source',
  Compiled = 'compiled',
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

// Always echoed in the object form, whichever spelling the declaration used, so a read never hands back
// two shapes of one member.
export interface PipelineVar {
  column?: string;
  jsonata?: string;
}

export interface PipelineAdvanced {
  scan_every?: string;
  rows_per_scan?: number;
  rows_per_call?: number;
  rate_rpm?: number;
  sample_fraction?: number;
}

/** Derived by the service from the transform's outputs and the target's columns; never sent back. */
export interface PipelineOutput {
  name: string;
  column: string;
  jsonata?: string;
}

export enum TransformType {
  Llm = 'llm',
  Sql = 'sql',
}

export enum TransformPreset {
  ChatCompletion = 'chat_completion',
}

/**
 * The pre-`outputs` output shape, carried only by a declaration folded from an evaluator that predates
 * `outputs`. Read-only to the console: it is served on the authored projection and accepted on a patch, so
 * a read-modify-write keeps it, but no control authors one.
 */
export interface TransformVar {
  name: string;
  type: string;
  sql?: string;
  jsonata?: string;
}

/** The object form of an llm output on the wire; a bare string is the same thing with only `prose`. */
export interface TransformOutputBody {
  prose?: string;
  values?: string[];
  jsonata?: string;
}

/**
 * `null` is what the service stores for an output declared with no refinement at all — the column already
 * carries the description, so the empty object the console sends is normalised away on write.
 */
export type TransformOutputSpec = string | TransformOutputBody | null;

/**
 * What a transform produces for one target column. The column owns the type, the enum domain and the
 * description, so an output carries only what the column cannot — and at most one of `values` / `jsonata`,
 * which the service refuses together.
 */
export interface TransformOutput {
  name: string;
  prose?: string;
  values?: string[];
  jsonata?: string;
  sql?: string;
}

/**
 * `inputs` and `outputs` are keyed by name on the wire — the input's variable name, the output's target
 * column — and the outputs map is served in declaration order, which is the order the model fills the
 * fields in.
 */
export interface PipelineTransform {
  type: TransformType;
  preset?: TransformPreset;
  model?: string;
  params?: Record<string, unknown>;
  request_template?: string;
  inputs?: Record<string, PipelineVar>;
  outputs?: Record<string, TransformOutputSpec>;
  output_vars?: TransformVar[];
  response_schema?: Record<string, unknown>;
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
  transform?: PipelineTransform;
  advanced?: PipelineAdvanced;
  group_by?: GroupKey[];
  measures?: Measure[];
}

/** Body of the enable/disable toggle, which is a state change rather than a re-declaration. */
export interface PipelineEnabledDto {
  enabled: boolean;
}

export interface Pipeline extends Omit<CreatePipelineDto, 'enabled'> {
  enabled: boolean;
  generation: number;
  created_at: string;
  updated_at: string;
  state?: PipelineState;
  grain_key?: string;
  version_column?: string;
  outputs?: PipelineOutput[];
  /** Composed by the service from the target's columns and the transform's outputs; never sent back. */
  response_schema?: Record<string, unknown>;
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
  /** The declaration's own transform type, so the listing names it without a compiled projection. */
  transform_type?: TransformType;
}
