import { describe, expect, test } from 'vitest';

import {
  FilterChipForm,
  FilterChipOperator,
  FilterValueKind,
} from '@/src/components/Analytics/QueryBuilder/Chips/models';
import {
  createFilterForm,
  filterOperatorChoices,
  filterOperatorForType,
  filterValueKind,
  isFilterFormValid,
  isNullOperator,
  splitListValue,
  toFilterForm,
  toFilterPredicate,
  withFilterField,
  withFilterOperator,
} from '@/src/components/Analytics/QueryBuilder/Chips/utils/filter';
import { createPredicate } from '@/src/components/Analytics/QueryBuilder/utils/state';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryOperator, QueryValueType } from '@/src/models/analytics/query';
import { FilterNodeKind, FilterOperandKind, FilterPredicateNode } from '@/src/models/analytics/query-builder';

const FIELDS: AnalyticsEntityField[] = [
  { name: 'model', type: AnalyticsFieldType.String, source: 'model' },
  { name: 'status', type: AnalyticsFieldType.Enum, source: 'status', enum_values: ['ok', 'failed'] },
  { name: 'is_error', type: AnalyticsFieldType.Boolean, source: 'is_error' },
  { name: 'latency', type: AnalyticsFieldType.Integer, source: 'latency' },
];

const ALL_OPERATORS: FilterChipOperator[] = [
  FilterChipOperator.Equals,
  FilterChipOperator.NotEquals,
  FilterChipOperator.Contains,
  FilterChipOperator.NotContains,
  FilterChipOperator.LessThan,
  FilterChipOperator.GreaterThan,
  FilterChipOperator.AtMost,
  FilterChipOperator.AtLeast,
  FilterChipOperator.InList,
  FilterChipOperator.IsEmpty,
  FilterChipOperator.IsNotEmpty,
];

const formOf = (overrides: Partial<FilterChipForm> = {}): FilterChipForm => ({
  field: 'model',
  operator: FilterChipOperator.Equals,
  value: '',
  values: [],
  ...overrides,
});

const predicateOf = (overrides: Partial<FilterPredicateNode> = {}): FilterPredicateNode => ({
  ...createPredicate(),
  field: 'model',
  ...overrides,
});

describe('splitListValue', () => {
  test('splits a comma-separated value into trimmed items', () => {
    expect(splitListValue('a, b ,c')).toEqual(['a', 'b', 'c']);
  });

  test('keeps a value without a separator as a single item', () => {
    expect(splitListValue('single')).toEqual(['single']);
  });

  test('drops blank items', () => {
    expect(splitListValue('a,, ,b,')).toEqual(['a', 'b']);
  });

  test('returns an empty list for an empty or separator-only value', () => {
    expect(splitListValue('')).toEqual([]);
    expect(splitListValue(' , ,')).toEqual([]);
  });
});

describe('isNullOperator', () => {
  test('recognizes the emptiness operators', () => {
    expect(isNullOperator(FilterChipOperator.IsEmpty)).toBe(true);
    expect(isNullOperator(FilterChipOperator.IsNotEmpty)).toBe(true);
  });

  test('rejects the operators that compare against a value', () => {
    expect(isNullOperator(FilterChipOperator.Equals)).toBe(false);
    expect(isNullOperator(FilterChipOperator.InList)).toBe(false);
  });
});

describe('filterOperatorChoices', () => {
  test('offers every operator when the field type is unknown', () => {
    expect(filterOperatorChoices()).toEqual(ALL_OPERATORS);
  });

  test('offers every operator for a string field', () => {
    expect(filterOperatorChoices(AnalyticsFieldType.String)).toEqual(ALL_OPERATORS);
  });

  test('withholds the contains operators for an enum field', () => {
    expect(filterOperatorChoices(AnalyticsFieldType.Enum)).toEqual(
      ALL_OPERATORS.filter(
        (operator) => operator !== FilterChipOperator.Contains && operator !== FilterChipOperator.NotContains,
      ),
    );
  });
});

describe('filterOperatorForType', () => {
  test('keeps an operator the field type supports', () => {
    expect(filterOperatorForType(FilterChipOperator.Contains, AnalyticsFieldType.String)).toBe(
      FilterChipOperator.Contains,
    );
    expect(filterOperatorForType(FilterChipOperator.GreaterThan, AnalyticsFieldType.Enum)).toBe(
      FilterChipOperator.GreaterThan,
    );
  });

  test('keeps the operator when the field type is unknown', () => {
    expect(filterOperatorForType(FilterChipOperator.NotContains)).toBe(FilterChipOperator.NotContains);
  });

  test('falls back to equals when an enum field does not support the operator', () => {
    expect(filterOperatorForType(FilterChipOperator.Contains, AnalyticsFieldType.Enum)).toBe(FilterChipOperator.Equals);
    expect(filterOperatorForType(FilterChipOperator.NotContains, AnalyticsFieldType.Enum)).toBe(
      FilterChipOperator.Equals,
    );
  });
});

describe('filterValueKind', () => {
  test('needs no value for an emptiness operator whatever the field type', () => {
    expect(filterValueKind(FilterChipOperator.IsEmpty, AnalyticsFieldType.Enum)).toBe(FilterValueKind.None);
    expect(filterValueKind(FilterChipOperator.IsNotEmpty, AnalyticsFieldType.Boolean)).toBe(FilterValueKind.None);
    expect(filterValueKind(FilterChipOperator.IsEmpty)).toBe(FilterValueKind.None);
  });

  test('takes a single enum value for an enum field', () => {
    expect(filterValueKind(FilterChipOperator.Equals, AnalyticsFieldType.Enum)).toBe(FilterValueKind.Enum);
  });

  test('takes several enum values for an enum field compared against a list', () => {
    expect(filterValueKind(FilterChipOperator.InList, AnalyticsFieldType.Enum)).toBe(FilterValueKind.EnumList);
  });

  test('takes a text list for a non-enum field compared against a list', () => {
    expect(filterValueKind(FilterChipOperator.InList, AnalyticsFieldType.String)).toBe(FilterValueKind.TextList);
    expect(filterValueKind(FilterChipOperator.InList, AnalyticsFieldType.Boolean)).toBe(FilterValueKind.TextList);
    expect(filterValueKind(FilterChipOperator.InList)).toBe(FilterValueKind.TextList);
  });

  test('takes a boolean value for a boolean field', () => {
    expect(filterValueKind(FilterChipOperator.Equals, AnalyticsFieldType.Boolean)).toBe(FilterValueKind.Boolean);
  });

  test('takes free text for any other or unknown field type', () => {
    expect(filterValueKind(FilterChipOperator.GreaterThan, AnalyticsFieldType.Integer)).toBe(FilterValueKind.Text);
    expect(filterValueKind(FilterChipOperator.Contains)).toBe(FilterValueKind.Text);
  });
});

describe('createFilterForm', () => {
  test('creates an empty form on the equals operator', () => {
    expect(createFilterForm()).toEqual({ field: '', operator: FilterChipOperator.Equals, value: '', values: [] });
  });
});

describe('toFilterForm', () => {
  test('reads a single-value predicate', () => {
    expect(toFilterForm(predicateOf({ op: QueryOperator.Gt, field: 'latency', value: '5' }))).toEqual({
      field: 'latency',
      operator: FilterChipOperator.GreaterThan,
      value: '5',
      values: [],
    });
  });

  test('splits the value of a list predicate into its items', () => {
    expect(toFilterForm(predicateOf({ op: QueryOperator.In, value: 'a, b' }))).toEqual({
      field: 'model',
      operator: FilterChipOperator.InList,
      value: 'a, b',
      values: ['a', 'b'],
    });
  });

  test('reads a null comparison as the is-empty operator', () => {
    expect(toFilterForm(predicateOf({ op: QueryOperator.Eq, isNull: true }))).toEqual({
      field: 'model',
      operator: FilterChipOperator.IsEmpty,
      value: '',
      values: [],
    });
  });

  test('reads a negated null comparison as the is-not-empty operator and drops a stale value', () => {
    expect(toFilterForm(predicateOf({ op: QueryOperator.Ne, isNull: true, value: 'stale' }))).toEqual({
      field: 'model',
      operator: FilterChipOperator.IsNotEmpty,
      value: '',
      values: [],
    });
  });
});

describe('withFilterField', () => {
  test('switches the field, keeps a supported operator and clears the value', () => {
    const form = formOf({ operator: FilterChipOperator.Contains, value: 'gpt', values: ['a'] });

    expect(withFilterField(form, 'latency', FIELDS)).toEqual({
      field: 'latency',
      operator: FilterChipOperator.Contains,
      value: '',
      values: [],
    });
  });

  test('falls back to equals when the new field is an enum that does not support the operator', () => {
    const form = formOf({ operator: FilterChipOperator.Contains, value: 'gpt' });

    expect(withFilterField(form, 'status', FIELDS)).toEqual({
      field: 'status',
      operator: FilterChipOperator.Equals,
      value: '',
      values: [],
    });
  });

  test('keeps the operator for a field the schema does not know', () => {
    const form = formOf({ operator: FilterChipOperator.NotContains });

    expect(withFilterField(form, 'unknown', [])).toEqual({
      field: 'unknown',
      operator: FilterChipOperator.NotContains,
      value: '',
      values: [],
    });
  });
});

describe('withFilterOperator', () => {
  test('keeps the value when the new operator takes the same kind of value', () => {
    const form = formOf({ value: 'gpt' });

    expect(withFilterOperator(form, FilterChipOperator.Contains, FIELDS)).toEqual({
      field: 'model',
      operator: FilterChipOperator.Contains,
      value: 'gpt',
      values: [],
    });
  });

  test('clears the value when switching from a single value to a list', () => {
    const form = formOf({ value: 'gpt' });

    expect(withFilterOperator(form, FilterChipOperator.InList, FIELDS)).toEqual({
      field: 'model',
      operator: FilterChipOperator.InList,
      value: '',
      values: [],
    });
  });

  test('clears the list when switching from a list to a single enum value', () => {
    const form = formOf({ field: 'status', operator: FilterChipOperator.InList, values: ['ok', 'failed'] });

    expect(withFilterOperator(form, FilterChipOperator.Equals, FIELDS)).toEqual({
      field: 'status',
      operator: FilterChipOperator.Equals,
      value: '',
      values: [],
    });
  });

  test('clears the value when switching to an emptiness operator', () => {
    const form = formOf({ value: 'gpt' });

    expect(withFilterOperator(form, FilterChipOperator.IsEmpty, FIELDS)).toEqual({
      field: 'model',
      operator: FilterChipOperator.IsEmpty,
      value: '',
      values: [],
    });
  });

  test('keeps the form values when switching between the emptiness operators', () => {
    const form = formOf({ operator: FilterChipOperator.IsEmpty });

    expect(withFilterOperator(form, FilterChipOperator.IsNotEmpty, FIELDS)).toEqual({
      field: 'model',
      operator: FilterChipOperator.IsNotEmpty,
      value: '',
      values: [],
    });
  });
});

describe('isFilterFormValid', () => {
  test('rejects a form without a field', () => {
    expect(isFilterFormValid(formOf({ field: '', value: 'gpt' }), FIELDS)).toBe(false);
  });

  test('accepts an emptiness operator without a value', () => {
    expect(isFilterFormValid(formOf({ operator: FilterChipOperator.IsEmpty }), FIELDS)).toBe(true);
  });

  test('accepts a single value and rejects a blank one', () => {
    expect(isFilterFormValid(formOf({ value: 'gpt' }), FIELDS)).toBe(true);
    expect(isFilterFormValid(formOf({ value: '' }), FIELDS)).toBe(false);
    expect(isFilterFormValid(formOf({ value: '   ' }), FIELDS)).toBe(false);
  });

  test('requires at least one item for a text list', () => {
    const form = formOf({ operator: FilterChipOperator.InList, value: 'ignored' });

    expect(isFilterFormValid(form, FIELDS)).toBe(false);
    expect(isFilterFormValid({ ...form, values: ['a'] }, FIELDS)).toBe(true);
  });

  test('requires at least one item for an enum list', () => {
    const form = formOf({ field: 'status', operator: FilterChipOperator.InList });

    expect(isFilterFormValid(form, FIELDS)).toBe(false);
    expect(isFilterFormValid({ ...form, values: ['ok'] }, FIELDS)).toBe(true);
  });

  test('validates a field the schema does not know as free text', () => {
    expect(isFilterFormValid(formOf({ field: 'unknown', value: 'x' }), [])).toBe(true);
    expect(isFilterFormValid(formOf({ field: 'unknown' }), [])).toBe(false);
  });
});

describe('toFilterPredicate', () => {
  const predicate = (overrides: Partial<FilterPredicateNode>): FilterPredicateNode => ({
    id: expect.any(String),
    kind: FilterNodeKind.Predicate,
    field: 'model',
    fn: null,
    args: [],
    op: QueryOperator.Eq,
    valueType: QueryValueType.String,
    value: '',
    isNull: false,
    rightKind: FilterOperandKind.Literal,
    rightFn: null,
    rightArgs: [],
    rightParam: null,
    ...overrides,
  });

  test('builds a literal predicate typed by the field and trims the value', () => {
    const form = formOf({ field: 'latency', operator: FilterChipOperator.GreaterThan, value: ' 5 ' });

    expect(toFilterPredicate(form, FIELDS)).toEqual(
      predicate({ field: 'latency', op: QueryOperator.Gt, valueType: QueryValueType.Integer, value: '5' }),
    );
  });

  test('keeps the given id when replacing an existing predicate', () => {
    expect(toFilterPredicate(formOf({ value: 'gpt' }), FIELDS, 'existing-id')).toEqual(
      predicate({ id: 'existing-id', value: 'gpt' }),
    );
  });

  test('generates a fresh id for each new predicate', () => {
    const form = formOf({ value: 'gpt' });

    expect(toFilterPredicate(form, FIELDS).id === toFilterPredicate(form, FIELDS).id).toBe(false);
  });

  test('joins the items of a list into one value', () => {
    const form = formOf({ operator: FilterChipOperator.InList, value: 'ignored', values: ['a', 'b'] });

    expect(toFilterPredicate(form, FIELDS)).toEqual(predicate({ op: QueryOperator.In, value: 'a, b' }));
  });

  test('builds a null comparison for the is-empty operator', () => {
    expect(toFilterPredicate(formOf({ operator: FilterChipOperator.IsEmpty }), FIELDS)).toEqual(
      predicate({ op: QueryOperator.Eq, isNull: true }),
    );
  });

  test('builds a negated null comparison for the is-not-empty operator', () => {
    expect(toFilterPredicate(formOf({ operator: FilterChipOperator.IsNotEmpty }), FIELDS)).toEqual(
      predicate({ op: QueryOperator.Ne, isNull: true }),
    );
  });

  test('types the value as a string for a field the schema does not know', () => {
    expect(toFilterPredicate(formOf({ field: 'unknown', value: 'x' }), [])).toEqual(
      predicate({ field: 'unknown', value: 'x' }),
    );
  });

  test('round-trips a list form through a predicate', () => {
    const form = formOf({ operator: FilterChipOperator.InList, value: 'a, b', values: ['a', 'b'] });

    expect(toFilterForm(toFilterPredicate(form, FIELDS))).toEqual(form);
  });
});
