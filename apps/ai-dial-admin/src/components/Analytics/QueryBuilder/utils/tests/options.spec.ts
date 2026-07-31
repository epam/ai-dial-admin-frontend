import { describe, expect, test } from 'vitest';

import { compactSelectLabel, toCompactSelectOptions } from '@/src/components/Analytics/QueryBuilder/utils/options';
import {
  OPERATOR_OPTION_DESCRIPTORS,
  SORT_DIRECTION_OPTION_DESCRIPTORS,
} from '@/src/constants/analytics/query-builder';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { QueryOperator, QuerySortDirection } from '@/src/models/analytics/query';

const t = (key: QueryBuilderI18nKey): string => key;

describe('toCompactSelectOptions', () => {
  test('resolves each descriptor into a value, code, translated label and description', () => {
    const options = toCompactSelectOptions(OPERATOR_OPTION_DESCRIPTORS, t);
    expect(options).toContainEqual({
      value: QueryOperator.Eq,
      label: QueryBuilderI18nKey.OperatorEq,
      description: QueryBuilderI18nKey.OperatorEqDescription,
    });
  });

  test('the case-insensitive contains operators are named, not coded', () => {
    const options = toCompactSelectOptions(OPERATOR_OPTION_DESCRIPTORS, t);
    expect(options.find((o) => o.value === QueryOperator.Ico)?.label).toBe(QueryBuilderI18nKey.OperatorCo);
    expect(options.find((o) => o.value === QueryOperator.Inc)?.label).toBe(QueryBuilderI18nKey.OperatorNc);
  });

  test('the case-sensitive contains operators are not offered for authoring', () => {
    const values = toCompactSelectOptions(OPERATOR_OPTION_DESCRIPTORS, t).map((o) => o.value);
    expect(values).not.toContain(QueryOperator.Co);
    expect(values).not.toContain(QueryOperator.Nc);
  });

  test('sort directions resolve to their own labels', () => {
    const options = toCompactSelectOptions(SORT_DIRECTION_OPTION_DESCRIPTORS, t);
    expect(options.map((o) => o.label)).toEqual([QueryBuilderI18nKey.DirectionAsc, QueryBuilderI18nKey.DirectionDesc]);
  });
});

describe('compactSelectLabel', () => {
  test('returns the matching option label', () => {
    expect(compactSelectLabel(toCompactSelectOptions(OPERATOR_OPTION_DESCRIPTORS, t), QueryOperator.Ge)).toBe(
      QueryBuilderI18nKey.OperatorGe,
    );
    expect(
      compactSelectLabel(toCompactSelectOptions(SORT_DIRECTION_OPTION_DESCRIPTORS, t), QuerySortDirection.Desc),
    ).toBe(QueryBuilderI18nKey.DirectionDesc);
  });

  // A value with no authoring option (e.g. the case-sensitive `co` from an authored query) shows the
  // raw model value — the same thing the select's own trigger falls back to.
  test('falls back to the raw value when no option matches', () => {
    const options = toCompactSelectOptions(OPERATOR_OPTION_DESCRIPTORS, t);
    expect(compactSelectLabel(options, QueryOperator.Co)).toBe('co');
  });
});
