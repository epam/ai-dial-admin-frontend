import { CreatePipelineDto, TruncUnit } from '@/src/models/analytics/pipeline';

export type PipelineDraft = Partial<CreatePipelineDto>;

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
