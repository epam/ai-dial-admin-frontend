import { describe, expect, test } from 'vitest';

import { ComparisonOp, ExprType, FilterNode, LogicalOp, ValueType } from '@/src/models/evaluation/structured-query';
import { TestCaseItemType } from '@/src/types/evaluation';

import {
  buildIncludedIdsQuery,
  createEmptyRunConditionFilter,
  deserializeRunConditionFilters,
  getRunConditionFieldOptions,
  isRunConditionFilterComplete,
  parseIncludedIds,
  serializeRunConditionFilters,
} from '../utils';
import { RunConditionLogicalOp, RunConditionOperator } from '../models';

describe('RunCondition utils', () => {
  test('getRunConditionFieldOptions includes base and schema fields', () => {
    const options = getRunConditionFieldOptions([
      { name: 'tags', type: TestCaseItemType.ARRAY, required: false, description: '' },
      { name: 'filename', type: TestCaseItemType.STRING, required: false, description: '' },
    ]);

    expect(options).toEqual([
      { field: 'id', displayName: 'ID', isArray: false },
      { field: 'test_case_name', displayName: 'Test case name', isArray: false },
      { field: 'data::tags', displayName: 'tags', isArray: true },
      { field: 'data::filename', displayName: 'filename', isArray: false },
    ]);
  });

  test('serializeRunConditionFilters returns null for empty filters', () => {
    expect(serializeRunConditionFilters([])).toBeNull();
  });

  test('serializeRunConditionFilters builds a single comparison', () => {
    const node = serializeRunConditionFilters([
      {
        id: '1',
        field: 'data::filename',
        displayName: 'filename',
        isArray: false,
        logicalOp: RunConditionLogicalOp.And,
        predicates: [{ operator: RunConditionOperator.Contain, value: 'gpt' }],
      },
    ]);

    expect(node).toEqual({
      op: ComparisonOp.Co,
      args: [
        { type: ExprType.Field, name: 'data::filename' },
        { type: ExprType.Value, value_type: ValueType.String, value: 'gpt' },
      ],
    });
  });

  test('serializeRunConditionFilters nests array predicates under and/or', () => {
    const node = serializeRunConditionFilters([
      {
        id: '1',
        field: 'data::tags',
        displayName: 'tags',
        isArray: true,
        logicalOp: RunConditionLogicalOp.Or,
        predicates: [
          { operator: RunConditionOperator.Contain, value: 'a' },
          { operator: RunConditionOperator.Contain, value: 'b' },
        ],
      },
    ]);

    expect(node?.op).toBe(LogicalOp.Or);
    expect((node as { args: FilterNode[] }).args).toHaveLength(2);
  });

  test('serializeRunConditionFilters ANDs multiple chips', () => {
    const node = serializeRunConditionFilters([
      {
        id: '1',
        field: 'id',
        displayName: 'ID',
        isArray: false,
        logicalOp: RunConditionLogicalOp.And,
        predicates: [{ operator: RunConditionOperator.Equal, value: '1' }],
      },
      {
        id: '2',
        field: 'data::filename',
        displayName: 'filename',
        isArray: false,
        logicalOp: RunConditionLogicalOp.And,
        predicates: [{ operator: RunConditionOperator.Contain, value: 'gpt' }],
      },
    ]);

    expect(node?.op).toBe(LogicalOp.And);
    expect((node as { args: FilterNode[] }).args).toHaveLength(2);
  });

  test('deserializeRunConditionFilters round-trips a scalar filter', () => {
    const original = serializeRunConditionFilters([
      {
        id: '1',
        field: 'data::filename',
        displayName: 'filename',
        isArray: false,
        logicalOp: RunConditionLogicalOp.And,
        predicates: [{ operator: RunConditionOperator.Contain, value: 'gpt' }],
      },
    ]);

    const filters = deserializeRunConditionFilters(original, [
      { name: 'filename', type: TestCaseItemType.STRING, required: false, description: '' },
    ]);

    expect(filters).toHaveLength(1);
    expect(filters[0].field).toBe('data::filename');
    expect(filters[0].predicates).toEqual([{ operator: RunConditionOperator.Contain, value: 'gpt' }]);
  });

  test('buildIncludedIdsQuery scopes by dataset_id and selects id', () => {
    const filter: FilterNode = {
      op: ComparisonOp.Co,
      args: [
        { type: ExprType.Field, name: 'data::filename' },
        { type: ExprType.Value, value_type: ValueType.String, value: 'gpt' },
      ],
    };

    const query = buildIncludedIdsQuery('dataset-1', filter);

    expect(query.entity).toBe('test_cases');
    expect(query.select).toEqual([{ expr: { type: ExprType.Field, name: 'id' } }]);
    expect(query.filter?.op).toBe(LogicalOp.And);
    const args = (query.filter as { args: FilterNode[] }).args;
    expect(args[0]).toEqual({
      op: ComparisonOp.Eq,
      args: [
        { type: ExprType.Field, name: 'dataset_id' },
        { type: ExprType.Value, value_type: ValueType.Uuid, value: 'dataset-1' },
      ],
    });
    expect(args[1]).toEqual(filter);
  });

  test('buildIncludedIdsQuery without filter only scopes by dataset_id', () => {
    const query = buildIncludedIdsQuery('dataset-1', null);
    expect(query.filter?.op).toBe(ComparisonOp.Eq);
  });

  test('parseIncludedIds extracts string ids', () => {
    expect(parseIncludedIds([{ id: 'a' }, { id: 2 }, {}])).toEqual(new Set(['a', '2']));
  });

  test('isRunConditionFilterComplete requires field and a non-empty value', () => {
    const empty = createEmptyRunConditionFilter();
    expect(isRunConditionFilterComplete(empty)).toBe(false);
    empty.predicates[0].value = 'x';
    expect(isRunConditionFilterComplete(empty)).toBe(false);
    empty.field = 'id';
    empty.displayName = 'ID';
    expect(isRunConditionFilterComplete(empty)).toBe(true);
  });
});
