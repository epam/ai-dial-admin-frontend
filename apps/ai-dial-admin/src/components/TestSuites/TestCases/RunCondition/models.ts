import { ComparisonOp, LogicalOp } from '@/src/models/evaluation/structured-query';

export enum RunConditionOperator {
  Contain = ComparisonOp.Co,
  NotContains = ComparisonOp.Nc,
  Equal = ComparisonOp.Eq,
  NotEqual = ComparisonOp.Ne,
}

export enum RunConditionLogicalOp {
  And = LogicalOp.And,
  Or = LogicalOp.Or,
}

export interface RunConditionPredicate {
  operator: RunConditionOperator;
  value: string;
}

export interface RunConditionFilter {
  id: string;
  field: string;
  displayName: string;
  isArray: boolean;
  logicalOp: RunConditionLogicalOp;
  predicates: RunConditionPredicate[];
}

export interface RunConditionFieldOption {
  field: string;
  displayName: string;
  isArray: boolean;
}
