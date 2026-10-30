import { DeploymentType } from '@/src/models/evaluation/deployment';
import { RunTargetKind } from '@/src/models/evaluation/run';
import { TestSuite } from '@/src/models/evaluation/test-suite';

/** The part of a test suite (or a run's suite snapshot) that identifies what it evaluates. */
export type SourceKindSuite = Pick<TestSuite, 'deploymentRef' | 'mcpDeploymentRef' | 'routesRef'>;

export const resolveSuiteSourceKind = (
  suite: SourceKindSuite,
  resolvedDeploymentType?: string,
): RunTargetKind | undefined => {
  if (suite.mcpDeploymentRef) {
    return RunTargetKind.Mcp;
  }
  if (suite.routesRef) {
    return RunTargetKind.Route;
  }

  const type = suite.deploymentRef?.type ?? resolvedDeploymentType;
  if (type === DeploymentType.Model) {
    return RunTargetKind.Model;
  }
  if (type === DeploymentType.Application) {
    return RunTargetKind.Application;
  }
  return undefined;
};

export const sourceKindDisplayLabel = (kind: RunTargetKind | undefined, fallback: string): string => kind ?? fallback;
