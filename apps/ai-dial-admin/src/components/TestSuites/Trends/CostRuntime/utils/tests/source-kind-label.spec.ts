import { describe, expect, test } from 'vitest';

import {
  resolveSuiteSourceKind,
  sourceKindDisplayLabel,
} from '@/src/components/TestSuites/Trends/CostRuntime/utils/source-kind-label';
import { DeploymentType } from '@/src/models/evaluation/deployment';
import { RunTargetKind } from '@/src/models/evaluation/run';
import { TestSuite } from '@/src/models/evaluation/test-suite';

describe('resolveSuiteSourceKind', () => {
  test('prefers MCP then Route over deployment type', () => {
    expect(
      resolveSuiteSourceKind({
        mcpDeploymentRef: { id: 'm', type: 'mcp', name: 'tool' },
        deploymentRef: { id: 'd', name: 'gpt', type: DeploymentType.Model },
      }),
    ).toBe(RunTargetKind.Mcp);

    expect(
      resolveSuiteSourceKind({
        routesRef: { name: 'search' },
        deploymentRef: { id: 'd', name: 'gpt', type: DeploymentType.Model },
      }),
    ).toBe(RunTargetKind.Route);
  });

  test('maps deployment type to Application or Model', () => {
    expect(
      resolveSuiteSourceKind({
        deploymentRef: { id: 'app', name: 'Agent', type: DeploymentType.Application },
      }),
    ).toBe(RunTargetKind.Application);

    expect(
      resolveSuiteSourceKind({
        deploymentRef: { id: 'm', name: 'gpt', type: DeploymentType.Model },
      }),
    ).toBe(RunTargetKind.Model);
  });

  test('uses resolvedDeploymentType when the ref has no type', () => {
    expect(resolveSuiteSourceKind({ deploymentRef: { id: 'm', name: 'gpt' } }, DeploymentType.Model)).toBe(
      RunTargetKind.Model,
    );
  });

  test('returns undefined when kind cannot be resolved', () => {
    expect(resolveSuiteSourceKind({} as TestSuite)).toBeUndefined();
  });
});

describe('sourceKindDisplayLabel', () => {
  test('returns the kind or the fallback', () => {
    expect(sourceKindDisplayLabel(RunTargetKind.Application, 'Source')).toBe('Application');
    expect(sourceKindDisplayLabel(undefined, 'Source')).toBe('Source');
  });
});
