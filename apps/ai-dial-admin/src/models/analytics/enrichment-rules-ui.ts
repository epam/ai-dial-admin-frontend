import { CreateRuleDto } from '@/src/models/analytics/rule';

export type RuleDraft = Partial<CreateRuleDto>;

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
