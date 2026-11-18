import { describe, expect, test } from 'vitest';

import { QueryScopeFilter } from '@/src/components/Analytics/QueryBuilder/SourcePanel/models';
import {
  filterSavedQueries,
  filterSourceTables,
  getDraftHref,
  getGroupKey,
  getQueryGroupKey,
  groupColumnsByTag,
  groupQueriesByTag,
  resolveDraftTable,
  toSourceTables,
} from '@/src/components/Analytics/QueryBuilder/SourcePanel/utils/source-panel';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { SavedQuery, SavedQueryScope } from '@/src/models/analytics/saved-query';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';

const field = (name: string, tag?: string): AnalyticsEntityField => ({
  name,
  type: AnalyticsFieldType.String,
  source: name,
  tag,
});

const query = (overrides: Partial<SavedQuery>): SavedQuery => ({
  id: 'sq_1',
  name: 'Query',
  scope: SavedQueryScope.Personal,
  generation: 1,
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-01T00:00:00Z',
  ...overrides,
});

const table = (overrides: Partial<AnalyticsTable>): AnalyticsTable => ({
  name: 'usage',
  type: AnalyticsTableType.Source,
  ...overrides,
});

describe('toSourceTables', () => {
  test('keeps the entity order and takes description and tag order from the catalog', () => {
    const tables = toSourceTables(
      [{ name: 'usage' }, { name: 'ratings' }],
      [table({ name: 'ratings', description: 'Ratings', tag_order: ['identity'] }), table({ name: 'usage' })],
    );

    expect(tables).toEqual([
      { name: 'usage', description: void 0, tagOrder: void 0 },
      { name: 'ratings', description: 'Ratings', tagOrder: ['identity'] },
    ]);
  });

  test('lists an entity with no catalog counterpart without a description', () => {
    expect(toSourceTables([{ name: 'usage' }], [])).toEqual([{ name: 'usage', description: void 0, tagOrder: void 0 }]);
  });

  test('ignores catalog tables that are not queryable entities', () => {
    expect(toSourceTables([], [table({ name: 'pending' })])).toEqual([]);
  });
});

describe('filterSourceTables', () => {
  const tables = [{ name: 'dial_usage_log' }, { name: 'response_ratings' }];

  test('returns every table for a blank search', () => {
    expect(filterSourceTables(tables, '  ')).toBe(tables);
  });

  test('matches a part of the name, ignoring case', () => {
    expect(filterSourceTables(tables, 'USAGE')).toEqual([{ name: 'dial_usage_log' }]);
  });

  test('returns nothing when no name matches', () => {
    expect(filterSourceTables(tables, 'sessions')).toEqual([]);
  });
});

describe('filterSavedQueries', () => {
  const queries = [
    query({ id: 'b', name: 'beta', scope: SavedQueryScope.Common, tag: 'Adoption' }),
    query({ id: 'a', name: 'Alpha' }),
    query({ id: 'c', name: 'cost adoption', scope: SavedQueryScope.Common }),
  ];

  const ids = (result: SavedQuery[]) => result.map((entry) => entry.id);

  test('orders by name, ignoring case, without mutating the input', () => {
    expect(ids(filterSavedQueries(queries, '', QueryScopeFilter.All))).toEqual(['a', 'b', 'c']);
    expect(ids(queries)).toEqual(['b', 'a', 'c']);
  });

  test('matches the search against name and tag', () => {
    expect(ids(filterSavedQueries(queries, 'adoption', QueryScopeFilter.All))).toEqual(['b', 'c']);
  });

  test('narrows to the chosen scope', () => {
    expect(ids(filterSavedQueries(queries, '', QueryScopeFilter.Personal))).toEqual(['a']);
    expect(ids(filterSavedQueries(queries, '', QueryScopeFilter.Common))).toEqual(['b', 'c']);
  });

  test('applies the search and the scope together', () => {
    expect(ids(filterSavedQueries(queries, 'adoption', QueryScopeFilter.Personal))).toEqual([]);
  });
});

describe('groupColumnsByTag', () => {
  const fields = [field('chat_id', 'identity'), field('cost', 'cost'), field('raw'), field('trace_id', 'identity')];

  test('groups by tag in first-seen order and lists untagged columns apart', () => {
    const tree = groupColumnsByTag(fields);

    expect(tree.groups.map((group) => group.tag)).toEqual(['identity', 'cost']);
    expect(tree.groups[0].fields.map((entry) => entry.name)).toEqual(['chat_id', 'trace_id']);
    expect(tree.untagged.map((entry) => entry.name)).toEqual(['raw']);
  });

  test('follows the table tag order and appends tags it does not name', () => {
    const tree = groupColumnsByTag([...fields, field('model', 'deployment')], ['cost', 'missing', 'identity']);

    expect(tree.groups.map((group) => group.tag)).toEqual(['cost', 'identity', 'deployment']);
  });

  test('returns an empty tree for no columns', () => {
    expect(groupColumnsByTag([])).toEqual({ groups: [], untagged: [] });
  });
});

describe('resolveDraftTable', () => {
  const entities = [{ name: 'usage' }, { name: 'ratings' }];

  test('returns the requested table when it is queryable', () => {
    expect(resolveDraftTable(entities, 'ratings')).toBe('ratings');
  });

  test('falls back to the first table for an unknown or absent name', () => {
    expect(resolveDraftTable(entities, 'gone')).toBe('usage');
    expect(resolveDraftTable(entities)).toBe('usage');
  });

  test('returns an empty name when there are no tables', () => {
    expect(resolveDraftTable([], 'usage')).toBe('');
  });
});

describe('getDraftHref', () => {
  test('builds a localized link to the draft builder', () => {
    expect(getDraftHref('en')).toBe('/en/queries');
  });
});

describe('getGroupKey', () => {
  test('scopes a tag to its table', () => {
    expect(getGroupKey('usage', 'cost')).toBe('usage:cost');
  });
});

describe('getQueryGroupKey', () => {
  test('prefixes the tag so it cannot match the key of a column group of a table named after it', () => {
    expect(getQueryGroupKey('finance')).toBe('query-tag:finance');
    expect(getQueryGroupKey('finance')).not.toBe(getGroupKey('finance', 'finance'));
  });

  test('keeps the case of the tag', () => {
    expect(getQueryGroupKey('Finance')).not.toBe(getQueryGroupKey('finance'));
  });
});

describe('groupQueriesByTag', () => {
  const ids = (entries: SavedQuery[]) => entries.map((entry) => entry.id);

  test('groups by tag, ordering the groups by tag name ignoring case', () => {
    const tree = groupQueriesByTag([
      query({ id: 'a', tag: 'cost' }),
      query({ id: 'b', tag: 'Adoption' }),
      query({ id: 'c', tag: 'Beta' }),
      query({ id: 'd', tag: 'adoption' }),
    ]);

    expect(tree.groups.map((group) => group.tag)).toEqual(['Adoption', 'adoption', 'Beta', 'cost']);
  });

  test('keeps the incoming order inside a group', () => {
    const tree = groupQueriesByTag([
      query({ id: 'z', tag: 'cost' }),
      query({ id: 'a', tag: 'cost' }),
      query({ id: 'm', tag: 'cost' }),
    ]);

    expect(tree.groups).toHaveLength(1);
    expect(ids(tree.groups[0].queries)).toEqual(['z', 'a', 'm']);
  });

  test('lists queries with a missing, empty or blank tag apart, in their incoming order', () => {
    const tree = groupQueriesByTag([
      query({ id: 'none' }),
      query({ id: 'tagged', tag: 'cost' }),
      query({ id: 'empty', tag: '' }),
      query({ id: 'blank', tag: '   ' }),
    ]);

    expect(ids(tree.untagged)).toEqual(['none', 'empty', 'blank']);
    expect(ids(tree.groups[0].queries)).toEqual(['tagged']);
  });

  test('puts tags that differ only by surrounding spaces in one group under the trimmed tag', () => {
    const tree = groupQueriesByTag([query({ id: 'a', tag: ' cost ' }), query({ id: 'b', tag: 'cost' })]);

    expect(tree.groups).toEqual([expect.objectContaining({ tag: 'cost' })]);
    expect(ids(tree.groups[0].queries)).toEqual(['a', 'b']);
  });

  test('returns only untagged queries when none carries a tag', () => {
    const untagged = [query({ id: 'a' }), query({ id: 'b' })];

    expect(groupQueriesByTag(untagged)).toEqual({ groups: [], untagged });
  });

  test('returns an empty tree for no queries without mutating the input', () => {
    const input: SavedQuery[] = [];

    expect(groupQueriesByTag(input)).toEqual({ groups: [], untagged: [] });
    expect(input).toEqual([]);
  });
});
