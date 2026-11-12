import { describe, expect, test } from 'vitest';

import { isFilterRepresentable, parseFilterRoot } from '@/src/components/Analytics/QueryBuilder/utils/deserialize';
import { serializeNode } from '@/src/components/Analytics/QueryBuilder/utils/serialize';
import { createPredicate } from '@/src/components/Analytics/QueryBuilder/utils/state';
import {
  CallerValueName,
  QueryExpr,
  QueryExprType,
  QueryFilterNode,
  QueryOperator,
} from '@/src/models/analytics/query';
import { FilterOperandKind, FilterPredicateNode } from '@/src/models/analytics/query-builder';

const field: QueryExpr = { type: QueryExprType.Field, name: 'project_id' };
const param: QueryExpr = { type: QueryExprType.Param, name: CallerValueName.Project };
const comparison = (op: QueryOperator, args: QueryExpr[]): QueryFilterNode => ({ op, args });

describe('caller value — serialize', () => {
  test('writes the caller value as a param beside the column', () => {
    const node: FilterPredicateNode = {
      ...createPredicate(),
      field: 'project_id',
      rightKind: FilterOperandKind.Param,
      rightParam: CallerValueName.Project,
    };

    expect(serializeNode(node, [])).toEqual(comparison(QueryOperator.Eq, [field, param]));
  });

  test('drops a condition whose caller value is not picked', () => {
    const node: FilterPredicateNode = {
      ...createPredicate(),
      field: 'project_id',
      rightKind: FilterOperandKind.Param,
    };

    expect(serializeNode(node, [])).toBeNull();
  });
});

describe('caller value — deserialize', () => {
  test('reads a param on the right as a caller-value condition', () => {
    const [condition] = parseFilterRoot(comparison(QueryOperator.Ne, [field, param]), []).children;

    expect(condition).toMatchObject({
      field: 'project_id',
      op: QueryOperator.Ne,
      rightKind: FilterOperandKind.Param,
      rightParam: CallerValueName.Project,
    });
  });

  test('puts the column first when the param was stored on the left', () => {
    const root = parseFilterRoot(comparison(QueryOperator.Eq, [param, field]), []);

    expect(root.children[0]).toMatchObject({ field: 'project_id', rightParam: CallerValueName.Project });
    expect(serializeNode(root, [])).toEqual({ op: 'and', args: [comparison(QueryOperator.Eq, [field, param])] });
  });
});

describe('caller value — representability', () => {
  test.each([
    ['on the right', [field, param]],
    ['on the left', [param, field]],
  ])('holds an equality with the param %s when caller values are allowed', (_name, args) => {
    expect(isFilterRepresentable(comparison(QueryOperator.Eq, args), 0, [], true)).toBe(true);
  });

  test('does not hold it where caller values are not allowed', () => {
    expect(isFilterRepresentable(comparison(QueryOperator.Eq, [field, param]), 0, [])).toBe(false);
  });

  test('does not hold a param under an operator other than equality', () => {
    expect(isFilterRepresentable(comparison(QueryOperator.Gt, [field, param]), 0, [], true)).toBe(false);
  });
});
