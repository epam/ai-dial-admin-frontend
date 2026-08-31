import { SortModelItem } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import { ConversationFilterOperator, ConversationsField } from '@/src/models/analytics/conversations-trace';
import { QuerySortDirection, QueryValueType } from '@/src/models/analytics/query';
import { GridFilterType } from '@/src/types/grid-filter';
import {
  ConversationGridFilterModel,
  translateConversationFilterModel,
  translateConversationSortModel,
} from '@/src/utils/analytics/conversation-grid-models';

const sortModel = (colId: string, sort = 'desc'): SortModelItem[] => [{ colId, sort } as SortModelItem];

describe('translateConversationSortModel', () => {
  test('turns a sortable column into a sort key', () => {
    expect(translateConversationSortModel(sortModel(ConversationsField.TotalPrice))).toEqual([
      { field: ConversationsField.TotalPrice, direction: QuerySortDirection.Desc },
    ]);
  });

  test('reads an ascending direction', () => {
    expect(translateConversationSortModel(sortModel(ConversationsField.TurnCount, 'asc'))).toEqual([
      { field: ConversationsField.TurnCount, direction: QuerySortDirection.Asc },
    ]);
  });

  test.each([[[] as SortModelItem[]], [undefined]])('returns nothing for %s', (model) => {
    expect(translateConversationSortModel(model)).toEqual([]);
  });

  test('drops a column that no stored field backs', () => {
    expect(translateConversationSortModel(sortModel('rating'))).toEqual([]);
  });

  test('drops an unknown column id', () => {
    expect(translateConversationSortModel(sortModel('not_a_field'))).toEqual([]);
  });

  // A stored sort model can name it even though the column offers no affordance; the query language orders
  // no array, so carrying it would produce an unstated order rather than the one asked for.
  test('drops the array-backed models field', () => {
    expect(translateConversationSortModel(sortModel(ConversationsField.Deployments))).toEqual([]);
  });

  test('keeps multiple keys in the order the grid gave them', () => {
    const model = [
      { colId: ConversationsField.ProjectId, sort: 'asc' },
      { colId: ConversationsField.TotalTokens, sort: 'desc' },
    ] as SortModelItem[];

    expect(translateConversationSortModel(model).map((key) => key.field)).toEqual([
      ConversationsField.ProjectId,
      ConversationsField.TotalTokens,
    ]);
  });
});

describe('translateConversationFilterModel', () => {
  const model = (entry: ConversationGridFilterModel): ConversationGridFilterModel => entry;

  test.each([
    [GridFilterType.CONTAINS, ConversationFilterOperator.Contains],
    [GridFilterType.NOT_CONTAINS, ConversationFilterOperator.NotContains],
    [GridFilterType.EQUALS, ConversationFilterOperator.Equals],
    [GridFilterType.NOT_EQUAL, ConversationFilterOperator.NotEquals],
  ])('maps the %s text operator to %s', (gridType, operator) => {
    const filters = translateConversationFilterModel(
      model({ [ConversationsField.ProjectId]: { type: gridType, filter: 'acme' } }),
    );

    expect(filters).toEqual([{ field: ConversationsField.ProjectId, operator, value: 'acme' }]);
  });

  test.each([
    [GridFilterType.GREATER_THAN, ConversationFilterOperator.GreaterThan],
    [GridFilterType.GREATER_THAN_OR_EQUAL, ConversationFilterOperator.GreaterThanOrEqual],
    [GridFilterType.LESS_THAN, ConversationFilterOperator.LessThan],
    [GridFilterType.LESS_THAN_OR_EQUAL, ConversationFilterOperator.LessThanOrEqual],
  ])('maps the %s number operator to %s', (gridType, operator) => {
    const filters = translateConversationFilterModel(
      model({ [ConversationsField.TurnCount]: { type: gridType, filter: 5 } }),
    );

    expect(filters).toEqual([{ field: ConversationsField.TurnCount, operator, value: '5' }]);
  });

  test('turns a number range into a range descriptor', () => {
    const filters = translateConversationFilterModel(
      model({ [ConversationsField.TotalTokens]: { type: 'inRange', filter: 10, filterTo: 20 } }),
    );

    expect(filters).toEqual([
      {
        field: ConversationsField.TotalTokens,
        operator: ConversationFilterOperator.Range,
        value: '10',
        valueTo: '20',
      },
    ]);
  });

  test('drops a range missing one of its bounds', () => {
    expect(
      translateConversationFilterModel(
        model({ [ConversationsField.TotalTokens]: { type: 'inRange', filter: 10, filterTo: null } }),
      ),
    ).toEqual([]);
  });

  test.each([[''], ['   '], [null], [undefined]])('drops an entry whose value is %s', (val) => {
    expect(
      translateConversationFilterModel(
        model({ [ConversationsField.ChatId]: { type: GridFilterType.CONTAINS, filter: val } }),
      ),
    ).toEqual([]);
  });

  test('trims the value', () => {
    const filters = translateConversationFilterModel(
      model({ [ConversationsField.ChatId]: { type: GridFilterType.CONTAINS, filter: '  acme  ' } }),
    );

    expect(filters).toEqual([
      { field: ConversationsField.ChatId, operator: ConversationFilterOperator.Contains, value: 'acme' },
    ]);
  });

  test('drops a column no stored field backs', () => {
    expect(translateConversationFilterModel(model({ rating: { type: GridFilterType.CONTAINS, filter: 'x' } }))).toEqual(
      [],
    );
  });

  test('drops a filter on the activity column', () => {
    expect(
      translateConversationFilterModel(
        model({ [ConversationsField.LastRequestTime]: { type: GridFilterType.GREATER_THAN, filter: '1' } }),
      ),
    ).toEqual([]);
  });

  test('drops an operator with no equivalent in the query language', () => {
    expect(
      translateConversationFilterModel(model({ [ConversationsField.ChatId]: { type: 'startsWith', filter: 'a' } })),
    ).toEqual([]);
  });

  test.each([[null], [undefined]])('returns nothing for a %s model', (model) => {
    expect(translateConversationFilterModel(model)).toEqual([]);
  });

  test('translates every entry of a multi-column model', () => {
    const filters = translateConversationFilterModel(
      model({
        [ConversationsField.ProjectId]: { type: GridFilterType.CONTAINS, filter: 'acme' },
        [ConversationsField.TotalPrice]: { type: GridFilterType.GREATER_THAN, filter: '0.5' },
      }),
    );

    expect(filters.map((filter) => filter.field)).toEqual([
      ConversationsField.ProjectId,
      ConversationsField.TotalPrice,
    ]);
  });

  describe('a value filter contributes one set-membership entry', () => {
    test('a selected list becomes a single membership filter', () => {
      const filters = translateConversationFilterModel(
        model({ [ConversationsField.InsightTopics]: { values: ['positive', 'neutral'] } }),
      );

      expect(filters).toEqual([
        {
          field: ConversationsField.InsightTopics,
          operator: ConversationFilterOperator.In,
          values: ['positive', 'neutral'],
        },
      ]);
    });

    // The same state a text entry with no value is in, and it must read the same way: no predicate, rather
    // than a predicate against nothing.
    test.each([[[] as string[]], [undefined]])('a selection of %s contributes nothing', (values) => {
      const filters = translateConversationFilterModel(model({ [ConversationsField.InsightTopics]: { values } }));

      expect(filters).toEqual([]);
    });

    test('a text filter is unaffected by the values branch', () => {
      const filters = translateConversationFilterModel(
        model({ [ConversationsField.ProjectId]: { type: GridFilterType.CONTAINS, filter: 'acme' } }),
      );

      expect(filters).toEqual([
        { field: ConversationsField.ProjectId, operator: ConversationFilterOperator.Contains, value: 'acme' },
      ]);
    });

    test("a selection carries the column's declared value type", () => {
      const filters = translateConversationFilterModel(
        model({ [ConversationsField.InsightTopics]: { values: ['positive'] } }),
        { valueTypes: { [ConversationsField.InsightTopics]: QueryValueType.String } },
      );

      expect(filters[0].valueType).toBe(QueryValueType.String);
    });
  });

  // The deployments column offers a text filter, answered over the array's elements: the entered text is
  // resolved to whole values by the server action, so the translation carries it like any other text entry.
  test('carries an entry naming the array-backed deployments field', () => {
    const filters = translateConversationFilterModel(
      model({ [ConversationsField.Deployments]: { type: GridFilterType.CONTAINS, filter: 'gpt-4.1' } }),
    );

    expect(filters).toEqual([
      {
        field: ConversationsField.Deployments,
        operator: ConversationFilterOperator.Contains,
        value: 'gpt-4.1',
      },
    ]);
  });
});
