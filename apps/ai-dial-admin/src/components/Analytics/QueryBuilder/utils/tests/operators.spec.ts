import { describe, expect, test } from 'vitest';

import {
  isEnumType,
  isNullableOperator,
  operatorForType,
  operatorOptionsForType,
} from '@/src/components/Analytics/QueryBuilder/utils/operators';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryOperator } from '@/src/models/analytics/query';

const OPTIONS = [QueryOperator.Eq, QueryOperator.Ico, QueryOperator.Inc, QueryOperator.Co, QueryOperator.In].map(
  (value) => ({ value, label: value }),
);

describe('isNullableOperator', () => {
  test('only equals and not equals compare against null', () => {
    expect(isNullableOperator(QueryOperator.Eq)).toBe(true);
    expect(isNullableOperator(QueryOperator.Ne)).toBe(true);
    expect(isNullableOperator(QueryOperator.Gt)).toBe(false);
    expect(isNullableOperator(QueryOperator.In)).toBe(false);
  });
});

describe('isEnumType', () => {
  test('recognises only the enum type', () => {
    expect(isEnumType(AnalyticsFieldType.Enum)).toBe(true);
    expect(isEnumType(AnalyticsFieldType.String)).toBe(false);
    expect(isEnumType(undefined)).toBe(false);
  });
});

describe('operatorOptionsForType', () => {
  test('withholds every contains operator from an enum operand', () => {
    const values = operatorOptionsForType(OPTIONS, AnalyticsFieldType.Enum).map((o) => o.value);
    expect(values).toEqual([QueryOperator.Eq, QueryOperator.In]);
  });

  test('offers every option for another type or an unresolved one', () => {
    expect(operatorOptionsForType(OPTIONS, AnalyticsFieldType.String)).toBe(OPTIONS);
    expect(operatorOptionsForType(OPTIONS, undefined)).toBe(OPTIONS);
  });
});

describe('operatorForType', () => {
  test('returns a contains operator on an enum operand to equals', () => {
    expect(operatorForType(QueryOperator.Ico, AnalyticsFieldType.Enum)).toBe(QueryOperator.Eq);
    expect(operatorForType(QueryOperator.Nc, AnalyticsFieldType.Enum)).toBe(QueryOperator.Eq);
  });

  test('keeps an operator the type admits', () => {
    expect(operatorForType(QueryOperator.In, AnalyticsFieldType.Enum)).toBe(QueryOperator.In);
    expect(operatorForType(QueryOperator.Ico, AnalyticsFieldType.String)).toBe(QueryOperator.Ico);
  });
});
