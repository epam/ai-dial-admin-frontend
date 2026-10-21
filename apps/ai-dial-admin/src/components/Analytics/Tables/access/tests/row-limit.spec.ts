import { describe, expect, test, vi } from 'vitest';

import {
  columnsToFields,
  findFieldMatches,
  findNamedField,
  hasUnfinishedCondition,
  parseFilterJson,
} from '@/src/components/Analytics/Tables/access/row-limit';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryExprType, QueryFilterNode, QueryOperator, QueryValueType } from '@/src/models/analytics/query';
import { createGroup, createPredicate } from '@/src/components/Analytics/QueryBuilder/utils/state';

const filter: QueryFilterNode = {
  op: QueryOperator.Eq,
  args: [
    { type: QueryExprType.Field, name: 'region' },
    { type: QueryExprType.Value, value_type: QueryValueType.String, value: 'EU' },
  ],
};

describe('columnsToFields', () => {
  test('maps every stored column to a field of the table, sensitive ones included', () => {
    const fields = columnsToFields('events', [
      {
        source_name: 'p',
        name: 'project_id',
        type: AnalyticsFieldType.String,
        tag: 'dimension',
        display_name: 'Project',
      },
      { source_name: 'e', name: 'user_email', type: AnalyticsFieldType.String, sensitive: true },
      { source_name: 'k', name: 'kind', type: AnalyticsFieldType.Enum, enum_values: ['a', 'b'] },
    ]);

    expect(fields).toEqual([
      expect.objectContaining({ name: 'project_id', source: 'events', tag: 'dimension', display_name: 'Project' }),
      expect.objectContaining({ name: 'user_email', sensitive: true }),
      expect.objectContaining({ name: 'kind', type: AnalyticsFieldType.Enum, enum_values: ['a', 'b'] }),
    ]);
  });

  test('maps no columns to no fields', () => {
    expect(columnsToFields('events', [])).toEqual([]);
  });
});

describe('parseFilterJson', () => {
  test('reads a filter object with an operator and arguments', () => {
    expect(parseFilterJson(JSON.stringify(filter))).toEqual(filter);
  });

  test.each([
    ['empty text', ''],
    ['text that is not JSON', '{op:'],
    ['a JSON array', '[]'],
    ['JSON null', 'null'],
    ['a number', '3'],
    ['an object without an operator', '{"args":[]}'],
    ['an object without arguments', '{"op":"eq"}'],
    ['an object whose arguments are not a list', '{"op":"eq","args":{}}'],
  ])('rejects %s', (_label, text) => {
    expect(parseFilterJson(text)).toBeNull();
  });
});

describe('findNamedField', () => {
  test('finds the field of the filter that the message names', () => {
    expect(findNamedField('region is not a column of this table', filter)).toBe('region');
  });

  test('ignores words that are not fields of the filter', () => {
    expect(findNamedField('the filter is not valid', filter)).toBeNull();
  });

  test('finds a dotted field name', () => {
    const dotted: QueryFilterNode = {
      op: QueryOperator.Eq,
      args: [{ type: QueryExprType.Field, name: 'enrich.score' }],
    };

    expect(findNamedField('enrich.score is not stored', dotted)).toBe('enrich.score');
  });

  test('finds nothing without a message or without a filter', () => {
    expect(findNamedField(undefined, filter)).toBeNull();
    expect(findNamedField('region is not a column', null)).toBeNull();
  });
});

describe('findFieldMatches', () => {
  test('asks the model for the lines that name the field and returns their ranges', () => {
    const range = { startLineNumber: 3, startColumn: 1, endLineNumber: 3, endColumn: 20 };
    const model = { findMatches: vi.fn(() => [{ range }]) };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(findFieldMatches(model as any, 'region')).toEqual([range]);
    expect(model.findMatches).toHaveBeenCalledWith('"name"\\s*:\\s*"region"', false, true, false, null, false);
  });

  test('escapes the pattern characters of a dotted field name', () => {
    const model = { findMatches: vi.fn(() => []) };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    findFieldMatches(model as any, 'enrich.score');

    expect(model.findMatches).toHaveBeenCalledWith('"name"\\s*:\\s*"enrich\\.score"', false, true, false, null, false);
  });
});

describe('hasUnfinishedCondition', () => {
  const filled = () => ({ ...createPredicate(), field: 'project_id', value: 'X' });

  test('is false for an empty root, which has nothing to store', () => {
    expect(hasUnfinishedCondition(createGroup())).toBe(false);
  });

  test('is false when every condition names a column', () => {
    const root = createGroup();
    root.children.push(filled(), filled());

    expect(hasUnfinishedCondition(root)).toBe(false);
  });

  test('is true for a condition with no column', () => {
    const root = createGroup();
    root.children.push(filled(), createPredicate());

    expect(hasUnfinishedCondition(root)).toBe(true);
  });

  test('is true for an unfinished condition inside a nested group', () => {
    const root = createGroup();
    const nested = createGroup();
    nested.children.push(createPredicate());
    root.children.push(filled(), nested);

    expect(hasUnfinishedCondition(root)).toBe(true);
  });

  test('is true for a nested group with no members, which serialization would drop', () => {
    const root = createGroup();
    root.children.push(filled(), createGroup());

    expect(hasUnfinishedCondition(root)).toBe(true);
  });
});
