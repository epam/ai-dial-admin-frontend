import { describe, expect, test } from 'vitest';

import {
  inSchemaOrder,
  selectedCount,
  toggledColumns,
} from '@/src/components/Analytics/QueryBuilder/Chips/utils/columns';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';

const FIELDS: AnalyticsEntityField[] = [
  { name: 'a', type: AnalyticsFieldType.String, source: 'a' },
  { name: 'b', type: AnalyticsFieldType.String, source: 'b' },
  { name: 'c', type: AnalyticsFieldType.Integer, source: 'c' },
];

describe('toggledColumns', () => {
  test('adds the given columns after the ones already selected', () => {
    expect(toggledColumns(['a'], ['b', 'c'], true)).toEqual(['a', 'b', 'c']);
  });

  test('does not duplicate a column that is already selected', () => {
    expect(toggledColumns(['a', 'b'], ['b', 'c'], true)).toEqual(['a', 'b', 'c']);
  });

  test('removes the given columns', () => {
    expect(toggledColumns(['a', 'b', 'c'], ['b', 'c'], false)).toEqual(['a']);
  });

  test('leaves the selection unchanged when removing a column that is not selected', () => {
    expect(toggledColumns(['a'], ['c'], false)).toEqual(['a']);
  });

  test('leaves the selection unchanged for an empty set of columns', () => {
    expect(toggledColumns(['a', 'b'], [], true)).toEqual(['a', 'b']);
    expect(toggledColumns(['a', 'b'], [], false)).toEqual(['a', 'b']);
  });

  test('selects into an empty selection', () => {
    expect(toggledColumns([], ['a'], true)).toEqual(['a']);
    expect(toggledColumns([], ['a'], false)).toEqual([]);
  });
});

describe('selectedCount', () => {
  test('counts the selected columns that exist in the schema', () => {
    expect(selectedCount(['c', 'a'], FIELDS)).toBe(2);
  });

  test('ignores a selected name the schema does not have', () => {
    expect(selectedCount(['a', 'gone'], FIELDS)).toBe(1);
  });

  test('counts nothing for an empty selection or an empty schema', () => {
    expect(selectedCount([], FIELDS)).toBe(0);
    expect(selectedCount(['a'], [])).toBe(0);
  });
});

describe('inSchemaOrder', () => {
  test('orders the selected columns as the schema declares them', () => {
    expect(inSchemaOrder(['c', 'a'], FIELDS)).toEqual(['a', 'c']);
  });

  test('drops a selected name the schema does not have', () => {
    expect(inSchemaOrder(['gone', 'b'], FIELDS)).toEqual(['b']);
  });

  test('returns an empty list for an empty selection or an empty schema', () => {
    expect(inSchemaOrder([], FIELDS)).toEqual([]);
    expect(inSchemaOrder(['a'], [])).toEqual([]);
  });
});
