import { describe, expect, test } from 'vitest';

import {
  QueryExprType,
  QueryLogicalOperator,
  QueryMode,
  QueryOperator,
  QueryPageType,
  QuerySortDirection,
  QueryValueExpr,
  QueryValueType,
} from '@/src/models/analytics/query';
import {
  aggregateQuery,
  and,
  col,
  eq,
  field,
  fn,
  gt,
  ico,
  inValues,
  isNotNull,
  le,
  ne,
  offsetPage,
  rowQuery,
  or,
  sortItem,
  value,
} from '@/src/utils/analytics/query-build';

describe('analytics query-build :: expressions', () => {
  test('field builds a field reference', () => {
    expect(field('chat_id')).toEqual({ type: QueryExprType.Field, name: 'chat_id' });
  });

  test('value builds a typed literal', () => {
    expect(value(QueryValueType.String, 'abc')).toEqual({
      type: QueryExprType.Value,
      value_type: QueryValueType.String,
      value: 'abc',
    });
  });

  test('value carries an explicit null literal', () => {
    expect(value(QueryValueType.Null, null)).toEqual({
      type: QueryExprType.Value,
      value_type: QueryValueType.Null,
      value: null,
    });
  });

  test('timestamp literals are epoch-millisecond strings, never ISO', () => {
    const date = new Date('2026-07-21T00:00:00.000Z');

    const literal = value(QueryValueType.Timestamp, String(date.getTime()));

    expect(literal.value_type).toBe(QueryValueType.Timestamp);
    expect(literal.value).toBe('1784592000000');
    expect(literal.value).toMatch(/^\d+$/);
    expect(literal.value).not.toContain('-');
    expect(literal.value).not.toContain('T');
  });

  test('fn omits distinct unless requested', () => {
    expect(fn('sum', [field('total_tokens')])).toEqual({
      type: QueryExprType.Fn,
      name: 'sum',
      args: [{ type: QueryExprType.Field, name: 'total_tokens' }],
    });
  });

  test('fn sets distinct when requested', () => {
    expect(fn('count', [field('trace_id')], true)).toEqual({
      type: QueryExprType.Fn,
      name: 'count',
      args: [{ type: QueryExprType.Field, name: 'trace_id' }],
      distinct: true,
    });
  });

  test('fn defaults to no arguments', () => {
    expect(fn('count')).toEqual({ type: QueryExprType.Fn, name: 'count', args: [] });
  });

  test('col omits the alias when not supplied', () => {
    expect(col(field('chat_id'))).toEqual({ expr: { type: QueryExprType.Field, name: 'chat_id' } });
  });

  test('col carries the alias when supplied', () => {
    expect(col(fn('sum', [field('total_tokens')]), 'tokens').as).toBe('tokens');
  });
});

describe('analytics query-build :: predicates', () => {
  test.each([
    ['eq', eq, QueryOperator.Eq],
    ['gt', gt, QueryOperator.Gt],
    ['le', le, QueryOperator.Le],
    ['ne', ne, QueryOperator.Ne],
  ])('%s puts the field first and the literal second', (_name, build, op) => {
    const node = build('request_time', value(QueryValueType.Timestamp, '1784592000000'));

    expect(node).toEqual({
      op,
      args: [
        { type: QueryExprType.Field, name: 'request_time' },
        { type: QueryExprType.Value, value_type: QueryValueType.Timestamp, value: '1784592000000' },
      ],
    });
  });

  test('and groups child nodes under the logical operator', () => {
    const child = ne('chat_id', value(QueryValueType.String, ''));

    expect(and([child])).toEqual({ op: QueryLogicalOperator.And, args: [child] });
  });

  test('and tolerates an empty child list', () => {
    expect(and([])).toEqual({ op: QueryLogicalOperator.And, args: [] });
  });

  test('or groups child nodes under the logical operator', () => {
    const child = ico('chat_id', 'acme');

    expect(or([child])).toEqual({ op: QueryLogicalOperator.Or, args: [child] });
  });

  test('ico builds the case-insensitive contains predicate as a string literal', () => {
    expect(ico('chat_id', 'acme')).toEqual({
      op: QueryOperator.Ico,
      args: [
        { type: QueryExprType.Field, name: 'chat_id' },
        { type: QueryExprType.Value, value_type: QueryValueType.String, value: 'acme' },
      ],
    });
  });

  test('ico always emits a string literal, whatever the term looks like', () => {
    ['42', '', 'null', 'true'].forEach((term) => {
      expect((ico('chat_id', term).args[1] as QueryValueExpr).value_type).toBe(QueryValueType.String);
    });
  });

  test('ico passes the term through verbatim, adding no wildcards', () => {
    expect((ico('chat_id', 'acme').args[1] as QueryValueExpr).value).toBe('acme');
  });

  test.each(['%', '_', '\\', 'a%b_c'])('ico leaves the LIKE metacharacter %s for the service to escape', (term) => {
    expect((ico('chat_id', term).args[1] as QueryValueExpr).value).toBe(term);
  });

  test('isNotNull is a ne against a typed null literal', () => {
    expect(isNotNull('rate')).toEqual({
      op: QueryOperator.Ne,
      args: [
        { type: QueryExprType.Field, name: 'rate' },
        { type: QueryExprType.Value, value_type: QueryValueType.Null, value: null },
      ],
    });
  });

  test('inValues builds an array expression of typed literals', () => {
    expect(inValues('chat_id', QueryValueType.String, ['a', 'b'])).toEqual({
      op: QueryOperator.In,
      args: [
        { type: QueryExprType.Field, name: 'chat_id' },
        {
          type: QueryExprType.Array,
          items: [
            { type: QueryExprType.Value, value_type: QueryValueType.String, value: 'a' },
            { type: QueryExprType.Value, value_type: QueryValueType.String, value: 'b' },
          ],
        },
      ],
    });
  });

  test('inValues preserves the supplied order and duplicates rather than normalising them', () => {
    const items = (inValues('chat_id', QueryValueType.String, ['b', 'a', 'b']).args[1] as { items: QueryValueExpr[] })
      .items;

    expect(items.map((item) => item.value)).toEqual(['b', 'a', 'b']);
  });
});

describe('analytics query-build :: sort and page', () => {
  test('sortItem carries the field and direction', () => {
    expect(sortItem('chat_id', QuerySortDirection.Asc)).toEqual({
      field: 'chat_id',
      dir: QuerySortDirection.Asc,
    });
  });

  test('offsetPage defaults to requesting no total', () => {
    expect(offsetPage(0, 20)).toEqual({
      type: QueryPageType.Offset,
      offset: 0,
      limit: 20,
      include_total: false,
    });
  });

  test('offsetPage carries the caller total request in both states', () => {
    expect(offsetPage(40, 100, true).include_total).toBe(true);
    expect(offsetPage(40, 100, false).include_total).toBe(false);
  });
});

describe('analytics query-build :: aggregate envelope', () => {
  const select = [col(fn('count', [field('trace_id')], true), 'turns')];

  test('sets aggregate mode explicitly', () => {
    const query = aggregateQuery({ entity: 'dial_usage_log', groupBy: ['chat_id'], select });

    expect(query.mode).toBe(QueryMode.Aggregate);
    expect(query.entity).toBe('dial_usage_log');
    expect(query.group_by).toEqual(['chat_id']);
    expect(query.select).toEqual(select);
  });

  test('omits optional sections that were not supplied', () => {
    const query = aggregateQuery({ entity: 'dial_usage_log', groupBy: ['chat_id'], select });

    expect(query.filter).toBeUndefined();
    expect(query.sort).toBeUndefined();
    expect(query.page).toBeUndefined();
  });

  test('omits an empty sort list rather than sending it', () => {
    const query = aggregateQuery({ entity: 'dial_usage_log', groupBy: ['chat_id'], select, sort: [] });

    expect(query.sort).toBeUndefined();
  });

  test('carries filter, sort and page when supplied', () => {
    const filter = and([ne('chat_id', value(QueryValueType.String, ''))]);
    const sort = [sortItem('chat_id', QuerySortDirection.Asc)];
    const page = offsetPage(0, 20);

    const query = aggregateQuery({ entity: 'dial_usage_log', groupBy: ['chat_id'], select, filter, sort, page });

    expect(query.filter).toEqual(filter);
    expect(query.sort).toEqual(sort);
    expect(query.page).toEqual(page);
  });

  test('omits group_by when the caller groups by nothing', () => {
    const query = aggregateQuery({ entity: 'conversations', select });

    expect(query.mode).toBe(QueryMode.Aggregate);
    expect(query.group_by).toBeUndefined();
  });
});

describe('analytics query-build :: row envelope', () => {
  const select = [col(field('chat_id'))];

  test('sets row mode explicitly and never groups', () => {
    const query = rowQuery({ entity: 'conversations', select });

    expect(query.mode).toBe(QueryMode.Row);
    expect(query.entity).toBe('conversations');
    expect(query.select).toEqual(select);
    expect(query.group_by).toBeUndefined();
  });

  test('omits optional sections that were not supplied', () => {
    const query = rowQuery({ entity: 'conversations', select });

    expect(query.filter).toBeUndefined();
    expect(query.sort).toBeUndefined();
    expect(query.page).toBeUndefined();
  });

  test('carries filter, sort and page when supplied', () => {
    const filter = and([ne('chat_id', value(QueryValueType.String, ''))]);
    const sort = [sortItem('chat_id', QuerySortDirection.Asc)];
    const page = offsetPage(0, 100, true);

    const query = rowQuery({ entity: 'conversations', select, filter, sort, page });

    expect(query.filter).toEqual(filter);
    expect(query.sort).toEqual(sort);
    expect(query.page).toEqual(page);
  });
});
