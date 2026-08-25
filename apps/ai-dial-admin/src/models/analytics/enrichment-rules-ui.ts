import { TriggerKind } from '@/src/models/analytics/rule';

export interface OutputBindingRow {
  id: string;
  column: string;
  var: string;
}

export interface OutputBindingRowError {
  isColumnUnavailable: boolean;
  isVarUnavailable: boolean;
  isTypeMismatch: boolean;
}

export interface CreateRuleForm {
  name: string;
  evaluatorName: string;
  evaluatorVersion: string;
  targetEnrichment: string;
  triggerKind: TriggerKind | '';
  enabled: boolean | null;
  triggerCron: string;
  idle: string;
  maxStaleness: string;
  costCeiling: string;
  bindings: OutputBindingRow[];
}
