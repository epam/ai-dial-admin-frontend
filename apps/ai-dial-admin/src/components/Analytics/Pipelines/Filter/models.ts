export enum PipelineFilterView {
  Builder = 'builder',
  Sql = 'sql',
}

export enum PipelineFilterMatch {
  All = 'all',
  Any = 'any',
}

// The builder's own operator set. The comparison and contains members carry the DSL operator codes, so the
// Query Builder's operator rules (`operatorOptionsForType`) apply to them unchanged; emptiness is an operator
// of its own here rather than a value type, because that is how a pipeline author reads it.
export enum PipelineFilterOperator {
  Eq = 'eq',
  Ne = 'ne',
  Lt = 'lt',
  Gt = 'gt',
  Le = 'le',
  Ge = 'ge',
  Contains = 'ico',
  NotContains = 'inc',
  In = 'in',
  IsEmpty = 'is_empty',
  IsNotEmpty = 'is_not_empty',
}

// Why a row is not written into the filter. `Incomplete` is counted but not shown on the row: an empty row is
// one the author is still filling in, not one they got wrong.
export enum PipelineFilterRowIssue {
  Incomplete = 'incomplete',
  Wildcard = 'wildcard',
  InvalidNumber = 'invalid_number',
  InvalidBoolean = 'invalid_boolean',
  InvalidDate = 'invalid_date',
  InvalidTimestamp = 'invalid_timestamp',
}

export enum PipelineFilterUnavailableReason {
  Unparsed = 'unparsed',
  NotFlat = 'not_flat',
  NoSource = 'no_source',
  NoSchema = 'no_schema',
}

// `value` holds one literal, or for `In` a comma-separated list, as the author typed or picked it.
export interface PipelineFilterRow {
  id: string;
  field: string;
  operator: PipelineFilterOperator;
  value: string;
}

export interface PipelineFilterRows {
  rows: PipelineFilterRow[];
  match: PipelineFilterMatch;
}

export interface RenderedPipelineFilter {
  sql: string;
  skippedCount: number;
}
