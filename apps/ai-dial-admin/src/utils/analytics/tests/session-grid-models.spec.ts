import { SortModelItem } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import { SessionFilterOperator, SessionsField } from '@/src/models/analytics/sessions-trace';
import { QuerySortDirection, QueryValueType } from '@/src/models/analytics/query';
import { GridFilterType } from '@/src/types/grid-filter';
import {
  SessionGridFilterModel,
  translateSessionFilterModel,
  translateSessionSortModel,
} from '@/src/utils/analytics/session-grid-models';

const sortModel = (colId: string, sort = 'desc'): SortModelItem[] => [{ colId, sort } as SortModelItem];

describe('translateSessionSortModel', () => {
  test('turns a sortable column into a sort key', () => {
    expect(translateSessionSortModel(sortModel(SessionsField.TotalPrice))).toEqual([
      { field: SessionsField.TotalPrice, direction: QuerySortDirection.Desc },
    ]);
  });

  test('reads an ascending direction', () => {
    expect(translateSessionSortModel(sortModel(SessionsField.TurnCount, 'asc'))).toEqual([
      { field: SessionsField.TurnCount, direction: QuerySortDirection.Asc },
    ]);
  });

  test.each([[[] as SortModelItem[]], [undefined]])('returns nothing for %s', (model) => {
    expect(translateSessionSortModel(model)).toEqual([]);
  });

  test('drops a column that no stored field backs', () => {
    expect(translateSessionSortModel(sortModel('rating'))).toEqual([]);
  });

  test('drops an unknown column id', () => {
    expect(translateSessionSortModel(sortModel('not_a_field'))).toEqual([]);
  });

  // A stored sort model can name it even though the column offers no affordance; the query language orders
  // no array, so carrying it would produce an unstated order rather than the one asked for.
  test('drops the array-backed models field', () => {
    expect(translateSessionSortModel(sortModel(SessionsField.Deployments))).toEqual([]);
  });

  test('keeps multiple keys in the order the grid gave them', () => {
    const model = [
      { colId: SessionsField.ProjectId, sort: 'asc' },
      { colId: SessionsField.TotalTokens, sort: 'desc' },
    ] as SortModelItem[];

    expect(translateSessionSortModel(model).map((key) => key.field)).toEqual([
      SessionsField.ProjectId,
      SessionsField.TotalTokens,
    ]);
  });
});

describe('translateSessionFilterModel', () => {
  const model = (entry: SessionGridFilterModel): SessionGridFilterModel => entry;

  test.each([
    [GridFilterType.CONTAINS, SessionFilterOperator.Contains],
    [GridFilterType.NOT_CONTAINS, SessionFilterOperator.NotContains],
    [GridFilterType.EQUALS, SessionFilterOperator.Equals],
    [GridFilterType.NOT_EQUAL, SessionFilterOperator.NotEquals],
  ])('maps the %s text operator to %s', (gridType, operator) => {
    const filters = translateSessionFilterModel(
      model({ [SessionsField.ProjectId]: { type: gridType, filter: 'acme' } }),
    );

    expect(filters).toEqual([{ field: SessionsField.ProjectId, operator, value: 'acme' }]);
  });

  test.each([
    [GridFilterType.GREATER_THAN, SessionFilterOperator.GreaterThan],
    [GridFilterType.GREATER_THAN_OR_EQUAL, SessionFilterOperator.GreaterThanOrEqual],
    [GridFilterType.LESS_THAN, SessionFilterOperator.LessThan],
    [GridFilterType.LESS_THAN_OR_EQUAL, SessionFilterOperator.LessThanOrEqual],
  ])('maps the %s number operator to %s', (gridType, operator) => {
    const filters = translateSessionFilterModel(model({ [SessionsField.TurnCount]: { type: gridType, filter: 5 } }));

    expect(filters).toEqual([{ field: SessionsField.TurnCount, operator, value: '5' }]);
  });

  test('turns a number range into a range descriptor', () => {
    const filters = translateSessionFilterModel(
      model({ [SessionsField.TotalTokens]: { type: 'inRange', filter: 10, filterTo: 20 } }),
    );

    expect(filters).toEqual([
      {
        field: SessionsField.TotalTokens,
        operator: SessionFilterOperator.Range,
        value: '10',
        valueTo: '20',
      },
    ]);
  });

  test('drops a range missing one of its bounds', () => {
    expect(
      translateSessionFilterModel(
        model({ [SessionsField.TotalTokens]: { type: 'inRange', filter: 10, filterTo: null } }),
      ),
    ).toEqual([]);
  });

  test.each([[''], ['   '], [null], [undefined]])('drops an entry whose value is %s', (val) => {
    expect(
      translateSessionFilterModel(model({ [SessionsField.ChatId]: { type: GridFilterType.CONTAINS, filter: val } })),
    ).toEqual([]);
  });

  test('trims the value', () => {
    const filters = translateSessionFilterModel(
      model({ [SessionsField.ChatId]: { type: GridFilterType.CONTAINS, filter: '  acme  ' } }),
    );

    expect(filters).toEqual([{ field: SessionsField.ChatId, operator: SessionFilterOperator.Contains, value: 'acme' }]);
  });

  test('drops a column no stored field backs', () => {
    expect(translateSessionFilterModel(model({ rating: { type: GridFilterType.CONTAINS, filter: 'x' } }))).toEqual([]);
  });

  test('drops a filter on the activity column', () => {
    expect(
      translateSessionFilterModel(
        model({ [SessionsField.LastRequestTime]: { type: GridFilterType.GREATER_THAN, filter: '1' } }),
      ),
    ).toEqual([]);
  });

  test('drops an operator with no equivalent in the query language', () => {
    expect(translateSessionFilterModel(model({ [SessionsField.ChatId]: { type: 'startsWith', filter: 'a' } }))).toEqual(
      [],
    );
  });

  test.each([[null], [undefined]])('returns nothing for a %s model', (model) => {
    expect(translateSessionFilterModel(model)).toEqual([]);
  });

  test('translates every entry of a multi-column model', () => {
    const filters = translateSessionFilterModel(
      model({
        [SessionsField.ProjectId]: { type: GridFilterType.CONTAINS, filter: 'acme' },
        [SessionsField.TotalPrice]: { type: GridFilterType.GREATER_THAN, filter: '0.5' },
      }),
    );

    expect(filters.map((filter) => filter.field)).toEqual([SessionsField.ProjectId, SessionsField.TotalPrice]);
  });

  describe('a value filter contributes one set-membership entry', () => {
    test('a selected list becomes a single membership filter', () => {
      const filters = translateSessionFilterModel(
        model({ [SessionsField.InsightTopics]: { values: ['positive', 'neutral'] } }),
      );

      expect(filters).toEqual([
        {
          field: SessionsField.InsightTopics,
          operator: SessionFilterOperator.In,
          values: ['positive', 'neutral'],
        },
      ]);
    });

    // The same state a text entry with no value is in, and it must read the same way: no predicate, rather
    // than a predicate against nothing.
    test.each([[[] as string[]], [undefined]])('a selection of %s contributes nothing', (values) => {
      const filters = translateSessionFilterModel(model({ [SessionsField.InsightTopics]: { values } }));

      expect(filters).toEqual([]);
    });

    test('a text filter is unaffected by the values branch', () => {
      const filters = translateSessionFilterModel(
        model({ [SessionsField.ProjectId]: { type: GridFilterType.CONTAINS, filter: 'acme' } }),
      );

      expect(filters).toEqual([
        { field: SessionsField.ProjectId, operator: SessionFilterOperator.Contains, value: 'acme' },
      ]);
    });

    test("a selection carries the column's declared value type", () => {
      const filters = translateSessionFilterModel(model({ [SessionsField.InsightTopics]: { values: ['positive'] } }), {
        valueTypes: { [SessionsField.InsightTopics]: QueryValueType.String },
      });

      expect(filters[0].valueType).toBe(QueryValueType.String);
    });
  });

  // The deployments column offers a text filter, answered over the array's elements: the entered text is
  // resolved to whole values by the server action, so the translation carries it like any other text entry.
  test('carries an entry naming the array-backed deployments field', () => {
    const filters = translateSessionFilterModel(
      model({ [SessionsField.Deployments]: { type: GridFilterType.CONTAINS, filter: 'gpt-4.1' } }),
    );

    expect(filters).toEqual([
      {
        field: SessionsField.Deployments,
        operator: SessionFilterOperator.Contains,
        value: 'gpt-4.1',
      },
    ]);
  });
});
