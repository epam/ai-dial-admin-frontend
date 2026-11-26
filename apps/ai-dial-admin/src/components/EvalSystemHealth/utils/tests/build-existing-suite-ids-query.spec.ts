import { describe, expect, test } from 'vitest';

import { buildExistingSuiteIdsQuery } from '@/src/components/EvalSystemHealth/utils/build-existing-suite-ids-query';
import { ExprType, QueryMode } from '@/src/models/evaluation/structured-query';

describe('buildExistingSuiteIdsQuery', () => {
  test('aggregates the ids of the test suites', () => {
    const query = buildExistingSuiteIdsQuery();

    expect(query.entity).toBe('test_suites');
    expect(query.mode).toBe(QueryMode.Aggregate);
    expect(query.group_by).toEqual(['id']);
    expect(query.select?.[0].expr).toMatchObject({ type: ExprType.Field, name: 'id' });
  });

  test('pages wide enough not to cut the list at the default size', () => {
    expect(buildExistingSuiteIdsQuery().page?.limit).toBeGreaterThan(100);
  });
});
