import { describe, expect, test } from 'vitest';

import { COST_AGGREGATION_STALE_AFTER_MS, COST_FETCH_MAX_WAIT_MS } from '@/src/components/Runs/Summary/constants';
import { Run, RunStatus, RunTargetKind } from '@/src/models/evaluation/run';
import { SuiteType } from '@/src/models/evaluation/test-suite';
import { isRunCostCalculating, resolveRunTarget, withCostWaitStart } from '../run-list-values';

describe('resolveRunTarget', () => {
  test('resolves a model deployment by its type', () => {
    const run: Run = {
      suiteSnapshot: {
        suiteType: SuiteType.Deployment,
        deploymentRef: { id: 'dep-1', name: 'gpt-4o', type: 'dial-model' },
      },
    };
    expect(resolveRunTarget(run)).toEqual({ name: 'gpt-4o', kind: RunTargetKind.Model });
  });

  test('resolves an application deployment by its type', () => {
    const run: Run = {
      suiteSnapshot: {
        suiteType: SuiteType.Deployment,
        deploymentRef: { id: 'app-1', name: 'PG Agent', type: 'dial-application' },
      },
    };
    expect(resolveRunTarget(run)).toEqual({ name: 'PG Agent', kind: RunTargetKind.Application });
  });

  test('resolves an MCP deployment ref to the MCP kind, regardless of its own type value', () => {
    const run: Run = {
      suiteSnapshot: {
        suiteType: SuiteType.McpTool,
        mcpDeploymentRef: { id: 'mcp-1', name: 'calculator', type: 'dial-toolset' },
      },
    };
    expect(resolveRunTarget(run)).toEqual({ name: 'calculator', kind: RunTargetKind.Mcp });
  });

  test('prefers the MCP ref over a deployment ref when both are present', () => {
    const run: Run = {
      suiteSnapshot: {
        deploymentRef: { id: 'dep-1', name: 'gpt-4o', type: 'dial-model' },
        mcpDeploymentRef: { id: 'mcp-1', name: 'calculator', type: 'dial-toolset' },
      },
    };
    expect(resolveRunTarget(run)).toEqual({ name: 'calculator', kind: RunTargetKind.Mcp });
  });

  test('resolves a route ref to the Route kind', () => {
    const run: Run = {
      suiteSnapshot: {
        suiteType: SuiteType.Route,
        routesRef: { name: 'routes/platform/search-route' },
      },
    };
    expect(resolveRunTarget(run)).toEqual({ name: 'search-route', kind: RunTargetKind.Route });
  });

  test('leaves the kind unset rather than guessing when the deployment type is unrecognized', () => {
    const run: Run = {
      suiteSnapshot: { deploymentRef: { id: 'dep-1', name: 'gpt-4o', type: 'some-future-type' } },
    };
    expect(resolveRunTarget(run)).toEqual({ name: 'gpt-4o', kind: undefined });
  });

  test('returns null for a run with no suite snapshot', () => {
    expect(resolveRunTarget({})).toBeNull();
  });

  test('returns null for a run with a snapshot but no named ref', () => {
    expect(resolveRunTarget({ suiteSnapshot: { suiteType: SuiteType.Deployment } })).toBeNull();
  });

  test('returns null for a missing or null run', () => {
    expect(resolveRunTarget(undefined)).toBeNull();
    expect(resolveRunTarget(null)).toBeNull();
  });
});

describe('isRunCostCalculating', () => {
  const NOW = 1_700_000_000_000;
  const settledRun: Run = { status: RunStatus.COMPLETED, completedAt: NOW - 60_000 };

  test('is calculating for a freshly settled run with no cost', () => {
    expect(isRunCostCalculating(settledRun, NOW)).toBe(true);
  });

  test.each([RunStatus.COMPLETED, RunStatus.FAILED, RunStatus.CANCELLED])('covers a %s run', (status) => {
    expect(isRunCostCalculating({ ...settledRun, status }, NOW)).toBe(true);
  });

  test.each([RunStatus.PENDING, RunStatus.RUNNING, RunStatus.CANCELLING])(
    'is not calculating for a %s run, which has nothing to aggregate yet',
    (status) => {
      expect(isRunCostCalculating({ ...settledRun, status }, NOW)).toBe(false);
    },
  );

  test('is not calculating once the run has a cost, zero included', () => {
    expect(isRunCostCalculating({ ...settledRun, totalCost: 0.5 }, NOW)).toBe(false);
    expect(isRunCostCalculating({ ...settledRun, totalCost: 0 }, NOW)).toBe(false);
  });

  test('is not calculating without a completion time', () => {
    expect(isRunCostCalculating({ ...settledRun, completedAt: undefined }, NOW)).toBe(false);
  });

  test.each([SuiteType.McpTool, SuiteType.Route])(
    'is not calculating for a %s suite, which never gets a cost',
    (suiteType) => {
      const run: Run = { ...settledRun, suiteSnapshot: { suiteType } };
      expect(isRunCostCalculating(run, NOW)).toBe(false);
    },
  );

  test('is still calculating for a deployment suite', () => {
    const run: Run = { ...settledRun, suiteSnapshot: { suiteType: SuiteType.Deployment } };
    expect(isRunCostCalculating(run, NOW)).toBe(true);
  });

  test('is not calculating for a run that completed over 12 hours ago, even inside a fresh wait window', () => {
    const run: Run = { ...settledRun, completedAt: NOW - COST_AGGREGATION_STALE_AFTER_MS, costWaitStartedAt: NOW };
    expect(isRunCostCalculating(run, NOW)).toBe(false);
    expect(isRunCostCalculating({ ...run, completedAt: NOW - COST_AGGREGATION_STALE_AFTER_MS + 1 }, NOW)).toBe(true);
  });

  test('stops calculating once the wait window has elapsed', () => {
    const run: Run = { ...settledRun, completedAt: NOW - COST_FETCH_MAX_WAIT_MS };
    expect(isRunCostCalculating(run, NOW)).toBe(false);
    expect(isRunCostCalculating({ ...settledRun, completedAt: NOW - COST_FETCH_MAX_WAIT_MS + 1 }, NOW)).toBe(true);
  });

  test('extends the window by the grace period', () => {
    const run: Run = { ...settledRun, completedAt: NOW - COST_FETCH_MAX_WAIT_MS };
    expect(isRunCostCalculating(run, NOW, 5_000)).toBe(true);
  });

  test('returns false for a missing run', () => {
    expect(isRunCostCalculating(undefined, NOW)).toBe(false);
    expect(isRunCostCalculating(null, NOW)).toBe(false);
  });

  test('opens the window at costWaitStartedAt, so a run finished well before the grid saw it still calculates', () => {
    const run: Run = { ...settledRun, completedAt: NOW - 60 * 60 * 1000, costWaitStartedAt: NOW - 1000 };
    expect(isRunCostCalculating(run, NOW)).toBe(true);
  });

  test('closes the window COST_FETCH_MAX_WAIT_MS after costWaitStartedAt', () => {
    const run: Run = { ...settledRun, costWaitStartedAt: NOW - COST_FETCH_MAX_WAIT_MS };
    expect(isRunCostCalculating(run, NOW)).toBe(false);
  });

  test('calculates for a settled run with a wait start but no completion time', () => {
    const run: Run = { status: RunStatus.FAILED, costWaitStartedAt: NOW };
    expect(isRunCostCalculating(run, NOW)).toBe(true);
  });
});

describe('withCostWaitStart', () => {
  const NOW = 1_700_000_000_000;

  test('stamps settled runs that have no cost', () => {
    const [run] = withCostWaitStart([{ id: 'a', status: RunStatus.COMPLETED, completedAt: 1 }], NOW);
    expect(run.costWaitStartedAt).toBe(NOW);
  });

  test('leaves runs with a cost, unsettled runs and already stamped runs untouched', () => {
    const priced: Run = { id: 'a', status: RunStatus.COMPLETED, totalCost: 0 };
    const running: Run = { id: 'b', status: RunStatus.RUNNING };
    const stamped: Run = { id: 'c', status: RunStatus.COMPLETED, costWaitStartedAt: 5 };

    expect(withCostWaitStart([priced, running, stamped], NOW)).toEqual([priced, running, stamped]);
  });
});
