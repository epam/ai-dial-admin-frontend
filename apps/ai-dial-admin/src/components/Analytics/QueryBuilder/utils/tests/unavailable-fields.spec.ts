import { describe, expect, test } from 'vitest';

import {
  referencedSchemaFields,
  unresolvedFieldNames,
} from '@/src/components/Analytics/QueryBuilder/utils/unavailable-fields';
import {
  createAggregate,
  createGroup,
  createGroupByColumn,
  createGroupByFn,
  createInitialState,
  createPredicate,
  createSort,
} from '@/src/components/Analytics/QueryBuilder/utils/state';
import { fnFixture, TEST_FUNCTIONS } from '@/src/components/Analytics/QueryBuilder/utils/tests/functions.fixture';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryMode } from '@/src/models/analytics/query';
import { QueryBuilderState } from '@/src/models/analytics/query-builder';

const FIELDS: AnalyticsEntityField[] = [
  { name: 'project_id', type: AnalyticsFieldType.String, source: 'dial_usage_log' },
  { name: 'turn_count', type: AnalyticsFieldType.Integer, source: 'dial_usage_log' },
];

const baseState = (): QueryBuilderState => {
  const state = createInitialState(TEST_FUNCTIONS);
  state.entityName = 'dial_usage_log';
  state.fields = FIELDS;
  return state;
};

const predicateOn = (field: string) => {
  const predicate = createPredicate();
  predicate.field = field;
  return predicate;
};

describe('referencedSchemaFields', () => {
  test('collects row-mode projection, filter and sort references', () => {
    const state = baseState();
    state.select = ['project_id'];
    state.filter.children.push(predicateOn('turn_count'));
    const sort = createSort();
    sort.field = 'project_id';
    state.sort = [sort];

    expect(referencedSchemaFields(state).sort()).toEqual(['project_id', 'turn_count']);
  });

  test('collects nested filter groups at any depth', () => {
    const state = baseState();
    const group = createGroup();
    group.children.push(predicateOn('turn_count'));
    state.filter.children.push(group);

    expect(referencedSchemaFields(state)).toEqual(['turn_count']);
  });

  test('collects aggregate group-by columns and function expression arguments', () => {
    const state = baseState();
    state.mode = QueryMode.Aggregate;
    // date_bin's third argument is the expression one; the first two are literals.
    const dateBin = fnFixture('date_bin');
    state.groupBy = [
      createGroupByColumn('project_id'),
      createGroupByFn(dateBin, [{ literal: '1' }, { literal: 'day' }, { field: 'turn_count' }], 'bucket'),
    ];

    expect(referencedSchemaFields(state).sort()).toEqual(['project_id', 'turn_count']);
  });

  test('a literal argument slot contributes no field reference', () => {
    const state = baseState();
    state.mode = QueryMode.Aggregate;
    // count's only argument is an optional expression, left unfilled here.
    state.aggregates = [createAggregate(fnFixture('count'), [{}], 'count')];

    expect(referencedSchemaFields(state)).toEqual([]);
  });

  test('having predicates are excluded — they address query outputs, not schema columns', () => {
    const state = baseState();
    state.mode = QueryMode.Aggregate;
    state.having.children.push(predicateOn('Count'));

    expect(referencedSchemaFields(state)).not.toContain('Count');
  });

  test('aggregate-mode sort keys are excluded — they address computed aliases', () => {
    const state = baseState();
    state.mode = QueryMode.Aggregate;
    const sort = createSort();
    sort.field = 'Request time (Date bin)';
    state.sort = [sort];

    expect(referencedSchemaFields(state)).not.toContain('Request time (Date bin)');
  });

  test('names are de-duplicated', () => {
    const state = baseState();
    state.select = ['project_id'];
    state.filter.children.push(predicateOn('project_id'));

    expect(referencedSchemaFields(state)).toEqual(['project_id']);
  });
});

describe('unresolvedFieldNames', () => {
  test('reports only names the schema does not account for', () => {
    const state = baseState();
    state.select = ['project_id', 'user_hash', 'cost_usd'];

    expect(unresolvedFieldNames(state)).toEqual(['user_hash', 'cost_usd']);
  });

  test('reports nothing when every reference resolves', () => {
    const state = baseState();
    state.select = ['project_id', 'turn_count'];

    expect(unresolvedFieldNames(state)).toEqual([]);
  });

  test('an unresolved schema flags nothing — a transient failure must not condemn the whole query', () => {
    const state = baseState();
    state.fields = [];
    state.select = ['project_id'];

    expect(unresolvedFieldNames(state)).toEqual([]);
  });
});
