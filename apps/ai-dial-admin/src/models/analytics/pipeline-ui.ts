import { CreatePipelineDto, PipelineTransform, TransformOutput, TruncUnit } from '@/src/models/analytics/pipeline';

/** `outputs` is a list here and a map on the wire: only a list carries the order through an editor that reorders rows. */
export interface TransformDraft extends Omit<PipelineTransform, 'outputs'> {
  outputs?: TransformOutput[];
}

export type PipelineDraft = Partial<Omit<CreatePipelineDto, 'transform'>> & { transform?: TransformDraft };

export enum SourceMode {
  Follow = 'follow',
  Pin = 'pin',
}

/** Whether a readiness condition is declared; an unchecked one keeps its value and is not sent. */
export enum ReadyWhenCondition {
  Idle = 'idle',
  Signal = 'signal',
  MaxStaleness = 'max_staleness',
}

export enum MemberScope {
  All = 'all',
  Selected = 'selected',
}

/** Which member a variable declares. The service refuses a spec that carries both. */
export enum VarBindingKind {
  Column = 'column',
  Jsonata = 'jsonata',
}

/** A variable while it is being edited: two rows may share a name, or be blank, which a map cannot hold. */
export interface VarRow {
  id: string;
  name: string;
  kind: VarBindingKind;
  /** The unselected member keeps what was typed and is left out of the declaration. */
  column: string;
  jsonata: string;
}

/** Whether a template placeholder is covered by a variable, or a variable matches no placeholder. */
export enum PlaceholderState {
  Covered = 'covered',
  Uncovered = 'uncovered',
  Unused = 'unused',
  Available = 'available',
}

export interface PlaceholderToken {
  name: string;
  state: PlaceholderState;
  /** What the placeholder renders, revealed on hover — the names alone say little. */
  description?: string;
}

export enum GroupKeyKind {
  Column = 'column',
  Trunc = 'trunc',
}

export interface GroupKeyRow {
  id: string;
  kind: GroupKeyKind;
  column: string;
  unit?: TruncUnit;
  as?: string;
}

export interface MeasureRow {
  id: string;
  name: string;
  fn: string;
  column?: string;
  where?: string;
  distinct?: boolean;
}

/**
 * Which refinement an llm output declares. The service refuses the two together and accepts neither, so
 * there is no "none" here: a selection with an empty field is what sends nothing.
 */
export enum OutputRefinementKind {
  Values = 'values',
  Jsonata = 'jsonata',
}

/**
 * The wire shape keys outputs by target column, which a draft cannot do: two rows may share a name — a
 * collision the editor reports — or carry none at all while being filled in.
 */
export interface OutputRow {
  id: string;
  name: string;
  /** Prose for an `llm` transform, the expression for a `sql` one; the type decides which is sent. */
  text: string;
  refinement: OutputRefinementKind;
  values: string[];
  jsonata: string;
}

/** Two rows may share a key, or be blank, which the object sent on the wire cannot hold. */
export interface TransformParamRow {
  id: string;
  key: string;
  value: string;
}
