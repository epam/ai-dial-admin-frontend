import { describe, expect, test } from 'vitest';

import {
  createSortForm,
  prunedSort,
  sortChipFieldOptions,
  toSortForm,
  toSortRow,
} from '@/src/components/Analytics/QueryBuilder/Chips/utils/sort';
import {
  createAggregate,
  createColumnRow,
  createInitialState,
} from '@/src/components/Analytics/QueryBuilder/utils/state';
import { fnFixture, TEST_FUNCTIONS } from '@/src/components/Analytics/QueryBuilder/utils/tests/functions.fixture';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryMode, QuerySortDirection, QuerySortNulls } from '@/src/models/analytics/query';
import { QueryBuilderState, SortRow } from '@/src/models/analytics/query-builder';

const FIELDS: AnalyticsEntityField[] = [
  { name: 'model', type: AnalyticsFieldType.String, source: 'model' },
  { name: 'latency', type: AnalyticsFieldType.Integer, source: 'latency' },
  { name: 'attributes', type: AnalyticsFieldType.Map, source: 'attributes' },
];

const sortRow = (id: string, field: string): SortRow => ({
  id,
  field,
  dir: QuerySortDirection.Asc,
  nulls: QuerySortNulls.Default,
});

const stateOf = (overrides: Partial<QueryBuilderState> = {}): QueryBuilderState => ({
  ...createInitialState(TEST_FUNCTIONS),
  fields: FIELDS,
  ...overrides,
});

const namesOf = (state: QueryBuilderState, exceptRowId?: string): string[] =>
  sortChipFieldOptions(state, exceptRowId).map((option) => option.name);

describe('sortChipFieldOptions', () => {
  test('offers every sortable column when nothing is sorted yet', () => {
    expect(namesOf(stateOf())).toEqual(['latency', 'model']);
  });

  test('withholds a column another sort key already uses', () => {
    expect(namesOf(stateOf({ sort: [sortRow('s1', 'model')] }))).toEqual(['latency']);
  });

  test('keeps the column of the sort key being edited', () => {
    const state = stateOf({ sort: [sortRow('s1', 'model'), sortRow('s2', 'latency')] });

    expect(namesOf(state, 's1')).toEqual(['model']);
  });

  test('offers nothing when the schema has no fields', () => {
    expect(namesOf(stateOf({ fields: [] }))).toEqual([]);
  });

  test('offers the output columns of an aggregate query', () => {
    const state = stateOf({
      mode: QueryMode.Aggregate,
      groupBy: [createColumnRow('model')],
      aggregates: [createAggregate(fnFixture('count'))],
    });

    expect(namesOf(state)).toEqual(['model', 'Row count']);
  });
});

describe('prunedSort', () => {
  test('keeps the sort keys whose column is still offered', () => {
    const kept = sortRow('s1', 'model');

    expect(prunedSort(stateOf({ sort: [kept, sortRow('s2', 'gone')] }))).toEqual([kept]);
  });

  test('returns an empty list when nothing is sorted', () => {
    expect(prunedSort(stateOf())).toEqual([]);
  });

  test('drops every sort key when the schema has no fields', () => {
    expect(prunedSort(stateOf({ fields: [], sort: [sortRow('s1', 'model')] }))).toEqual([]);
  });

  test('keeps only the keys naming an output column of an aggregate query', () => {
    const grouped = sortRow('s1', 'model');
    const measured = sortRow('s3', 'Row count');
    const state = stateOf({
      mode: QueryMode.Aggregate,
      groupBy: [createColumnRow('model')],
      aggregates: [createAggregate(fnFixture('count'))],
      sort: [grouped, sortRow('s2', 'latency'), measured],
    });

    expect(prunedSort(state)).toEqual([grouped, measured]);
  });
});

describe('createSortForm', () => {
  test('creates an empty ascending form', () => {
    expect(createSortForm()).toEqual({ field: '', dir: QuerySortDirection.Asc });
  });
});

describe('toSortForm', () => {
  test('reads the field and direction of a sort key', () => {
    expect(toSortForm({ ...sortRow('s1', 'model'), dir: QuerySortDirection.Desc })).toEqual({
      field: 'model',
      dir: QuerySortDirection.Desc,
    });
  });
});

describe('toSortRow', () => {
  test('builds a sort key with a generated id and the default nulls placement', () => {
    expect(toSortRow({ field: 'model', dir: QuerySortDirection.Desc })).toEqual({
      id: expect.any(String),
      field: 'model',
      dir: QuerySortDirection.Desc,
      nulls: QuerySortNulls.Default,
    });
  });

  test('keeps the given id when replacing an existing sort key', () => {
    expect(toSortRow({ field: 'latency', dir: QuerySortDirection.Asc }, 's1')).toEqual(sortRow('s1', 'latency'));
  });

  test('generates a fresh id for each new sort key', () => {
    const form = { field: 'model', dir: QuerySortDirection.Asc };

    expect(toSortRow(form).id === toSortRow(form).id).toBe(false);
  });
});
