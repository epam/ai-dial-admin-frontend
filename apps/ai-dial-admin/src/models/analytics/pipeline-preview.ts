/**
 * The dry-run of a pipeline: `POST /v1/pipelines/{name}/preview`. One shape serves every kind, and the
 * members that do not apply to a kind are absent rather than null.
 */

/** What a column is to the declaration, as the service names it. */
export enum PreviewColumnRole {
  Key = 'key',
  Measure = 'measure',
  GrainKey = 'grain_key',
  Output = 'output',
  Input = 'input',
}

/** `warning` is worth acting on before arming; `info` is worth knowing. */
export enum PreviewNoteSeverity {
  Info = 'info',
  Warning = 'warning',
}

/**
 * The service's closed set of note codes. A code the console does not know still arrives as a string on
 * `PreviewNote.code`, so the presenter shows it under a generic title instead of dropping it.
 */
export enum PreviewNoteCode {
  NoMatchingRows = 'no_matching_rows',
  HeldByEnrichment = 'held_by_enrichment',
  EnrichmentBehind = 'enrichment_behind',
  TargetTypeNarrowing = 'target_type_narrowing',
  ValueOutOfTargetRange = 'value_out_of_target_range',
  NoGroupFound = 'no_group_found',
  GroupCutByFetchLimit = 'group_cut_by_fetch_limit',
  OutputWithoutDescription = 'output_without_description',
  UnconstrainedResponse = 'unconstrained_response',
  ValuesTruncated = 'values_truncated',
}

export interface PreviewColumn {
  name: string;
  /** Absent for a column the service attaches no role to. */
  role?: PreviewColumnRole;
  /** The type of the value as sampled. */
  type: string;
  /** The target column's type; present for `key`, `measure` and `output` only. */
  target_type?: string;
  /** The largest UTF-8 size of a non-null sampled value, measured before the 2 KB cap. */
  max_bytes?: number;
}

export interface PreviewNote {
  code: PreviewNoteCode | string;
  severity: PreviewNoteSeverity;
  /** The column, output or enrichment the note is about, for the codes that name one. */
  subject?: string;
  message: string;
}

export type PreviewRow = Record<string, unknown>;

export interface PipelinePreview {
  /** Absent for an LLM pipeline, whose sample has no single statement. */
  statement?: string;
  columns: PreviewColumn[];
  rows: PreviewRow[];
  /** Aggregate only: the group count over the whole input. */
  total_rows?: number;
  /** Group trigger only: the group the sample describes. */
  group_key?: string;
  notes: PreviewNote[];
}
