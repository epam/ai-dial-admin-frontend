import { CreatePipelineDto, TruncUnit } from '@/src/models/analytics/pipeline';

export type PipelineDraft = Partial<CreatePipelineDto>;

export enum SourceMode {
  Follow = 'follow',
  Pin = 'pin',
}

export enum InputBindingKind {
  Column = 'column',
  Jsonata = 'jsonata',
}

export interface OutputBindingRow {
  id: string;
  column: string;
  var: string;
}

export interface InputBindingRow {
  id: string;
  var: string;
  kind: InputBindingKind;
  value: string;
}

export interface BindingRowError {
  isColumnUnavailable: boolean;
  isVarUnavailable: boolean;
  isTypeMismatch: boolean;
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
