import { describe, expect, test } from 'vitest';

import {
  createGroup,
  createPredicate,
  createSort,
  renamedFilterFields,
  renamedSortKeys,
} from '@/src/components/Analytics/QueryBuilder/utils/state';
import { FilterNodeKind, FilterPredicateNode } from '@/src/models/analytics/query-builder';
import { QueryLogicalOperator } from '@/src/models/analytics/query';

const sortOn = (fieldName: string) => ({ ...createSort(), field: fieldName });
const predicateOn = (fieldName: string): FilterPredicateNode => ({ ...createPredicate(), field: fieldName });

describe('renamedSortKeys', () => {
  test('rewrites only the keys naming the old column', () => {
    const sort = [sortOn('Total tokens (Sum)'), sortOn('deployment')];
    const renamed = renamedSortKeys(sort, 'Total tokens (Sum)', 'Latency (Sum)');
    expect(renamed.map((s) => s.field)).toEqual(['Latency (Sum)', 'deployment']);
  });

  test('leaves the input untouched and is a no-op when nothing matches', () => {
    const sort = [sortOn('deployment')];
    expect(renamedSortKeys(sort, 'absent', 'other').map((s) => s.field)).toEqual(['deployment']);
    expect(sort[0].field).toBe('deployment');
  });
});

describe('renamedFilterFields', () => {
  test('rewrites matching predicates at the root and inside nested groups', () => {
    const nested = createGroup(QueryLogicalOperator.Or);
    nested.children = [predicateOn('Total tokens (Sum)'), predicateOn('deployment')];
    const root = createGroup();
    root.children = [predicateOn('Total tokens (Sum)'), nested];

    const renamed = renamedFilterFields(root, 'Total tokens (Sum)', 'Latency (Sum)');

    const rootPredicate = renamed.children[0] as FilterPredicateNode;
    const renamedNested = renamed.children[1];
    expect(rootPredicate.field).toBe('Latency (Sum)');
    expect(renamedNested.kind).toBe(FilterNodeKind.Group);
    if (renamedNested.kind === FilterNodeKind.Group) {
      expect(renamedNested.children.map((c) => (c as FilterPredicateNode).field)).toEqual([
        'Latency (Sum)',
        'deployment',
      ]);
    }
  });

  test('leaves the original tree untouched', () => {
    const root = createGroup();
    root.children = [predicateOn('old')];
    renamedFilterFields(root, 'old', 'new');
    expect((root.children[0] as FilterPredicateNode).field).toBe('old');
  });
});
