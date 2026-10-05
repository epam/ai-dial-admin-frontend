import { describe, expect, test } from 'vitest';

import { Run, RunTargetKind } from '@/src/models/evaluation/run';
import { SuiteType } from '@/src/models/evaluation/test-suite';
import { resolveRunTarget } from '../run-list-values';

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
