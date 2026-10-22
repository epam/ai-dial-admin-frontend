import { SelectOption } from '@epam/ai-dial-ui-kit';

import { ENUM_UNSUPPORTED_OPERATORS } from '@/src/constants/analytics/query-builder';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryOperator } from '@/src/models/analytics/query';

// A null comparison exists in the SQL subset only as `IS [NOT] NULL`, which is what eq/ne render to.
export const isNullableOperator = (op: QueryOperator): boolean => op === QueryOperator.Eq || op === QueryOperator.Ne;

export const isEnumType = (type?: string): boolean => type === AnalyticsFieldType.Enum;

// Keyed on the resolved type alone — no list here names which fields are enums, so a field an instance
// begins reporting as one is guarded with no change.
export const operatorOptionsForType = (options: SelectOption[], type?: string): SelectOption[] =>
  isEnumType(type)
    ? options.filter((option) => !ENUM_UNSUPPORTED_OPERATORS.includes(option.value as QueryOperator))
    : options;

// Retargeting a contains condition at an enum operand would otherwise leave it serializing a predicate the
// service rejects outright, so the operator falls back to equals.
export const operatorForType = (op: QueryOperator, type?: string): QueryOperator =>
  isEnumType(type) && ENUM_UNSUPPORTED_OPERATORS.includes(op) ? QueryOperator.Eq : op;
