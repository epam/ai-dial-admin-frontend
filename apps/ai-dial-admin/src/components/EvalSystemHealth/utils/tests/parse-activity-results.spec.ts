import { describe, expect, test } from 'vitest';

import {
  countRows,
  countTargetedEvaluatees,
  readTotalCount,
} from '@/src/components/EvalSystemHealth/utils/parse-activity-results';

describe('countRows', () => {
  test('counts the rows of the result', () => {
    expect(countRows({ rows: [{}, {}, {}] })).toBe(3);
  });

  test('reads a result without rows as empty', () => {
    expect(countRows({} as never)).toBe(0);
  });
});

describe('readTotalCount', () => {
  test('prefers the total the backend reports over the rows that came back', () => {
    expect(readTotalCount({ rows: [{}], totalCount: 348 })).toBe(348);
  });

  test('falls back to the number of rows when no total is reported', () => {
    expect(readTotalCount({ rows: [{}, {}] })).toBe(2);
  });

  test('keeps a reported total of zero', () => {
    expect(readTotalCount({ rows: [], totalCount: 0 })).toBe(0);
  });
});

describe('countTargetedEvaluatees', () => {
  test('counts distinct deployments and toolsets across both refs', () => {
    expect(
      countTargetedEvaluatees({
        rows: [
          { 'deployment_ref::id': 'gpt-4o', 'mcp_deployment_ref::id': null },
          { 'deployment_ref::id': null, 'mcp_deployment_ref::id': 'github' },
          { 'deployment_ref::id': 'claude', 'mcp_deployment_ref::id': null },
        ],
      }),
    ).toBe(3);
  });

  test('counts a deployment targeted by several suites once', () => {
    expect(
      countTargetedEvaluatees({
        rows: [{ 'deployment_ref::id': 'gpt-4o' }, { 'deployment_ref::id': 'gpt-4o' }],
      }),
    ).toBe(1);
  });

  test('counts the same id written encoded and plain once', () => {
    expect(
      countTargetedEvaluatees({
        rows: [{ 'deployment_ref::id': 'Code%20Apps' }, { 'deployment_ref::id': 'Code Apps' }],
      }),
    ).toBe(1);
  });

  test('adds nothing for a row that targets nothing', () => {
    expect(
      countTargetedEvaluatees({
        rows: [
          { 'deployment_ref::id': null, 'mcp_deployment_ref::id': null, 'routes_ref::name': null },
          { 'deployment_ref::id': '', 'routes_ref::name': '' },
          {},
        ],
      }),
    ).toBe(0);
  });

  test('counts a route-targeted suite as one evaluatee', () => {
    expect(countTargetedEvaluatees({ rows: [{ 'routes_ref::name': 'routes/platform/echo' }] })).toBe(1);
  });

  test('counts suites on the same route once', () => {
    expect(
      countTargetedEvaluatees({
        rows: [
          { 'routes_ref::name': 'routes/platform/echo' },
          { 'routes_ref::name': 'routes/platform/echo' },
          { 'routes_ref::name': 'routes/platform/echo' },
        ],
      }),
    ).toBe(1);
  });

  test('counts a route written prefixed and plain once', () => {
    expect(
      countTargetedEvaluatees({
        rows: [{ 'routes_ref::name': 'routes/platform/echo' }, { 'routes_ref::name': 'echo' }],
      }),
    ).toBe(1);
  });

  test('adds routes to the deployments and toolsets', () => {
    expect(
      countTargetedEvaluatees({
        rows: [
          { 'deployment_ref::id': 'gpt-4o' },
          { 'deployment_ref::id': 'claude' },
          { 'mcp_deployment_ref::id': 'github' },
          { 'routes_ref::name': 'routes/platform/a' },
          { 'routes_ref::name': 'routes/platform/b' },
          { 'routes_ref::name': 'routes/platform/c' },
        ],
      }),
    ).toBe(6);
  });

  test('counts a route and a deployment of the same name as two evaluatees', () => {
    expect(
      countTargetedEvaluatees({
        rows: [{ 'deployment_ref::id': 'echo' }, { 'routes_ref::name': 'routes/platform/echo' }],
      }),
    ).toBe(2);
  });

  test('reads a result without rows as targeting nothing', () => {
    expect(countTargetedEvaluatees({} as never)).toBe(0);
  });
});
