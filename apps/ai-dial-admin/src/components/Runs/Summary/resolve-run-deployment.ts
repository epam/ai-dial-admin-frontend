import { RunDeployment } from '@/src/components/Runs/View/models';
import { APPLICATIONS_PREFIX, TOOLSETS_PREFIX } from '@/src/constants/publications-core';
import { SuiteSnapshot, SuiteType, TestSuite } from '@/src/models/evaluation/test-suite';
import { ApplicationRoute } from '@/src/types/routes';
import {
  resolveDeploymentNavigationTarget,
  resolveMcpDeploymentNavigationTarget,
} from '@/src/utils/deployment-navigation';

export type SuiteContext = SuiteSnapshot | TestSuite | null | undefined;

const isAssetMcpDeploymentId = (id?: string): boolean =>
  !!id && (id.startsWith(TOOLSETS_PREFIX) || id.startsWith(APPLICATIONS_PREFIX));

/**
 * Prefer the live suite's MCP ref for open-in-new-tab when it points at an asset path.
 * Run snapshots have been observed with incomplete `toolsets/…` ids (missing folder segments)
 * while the live suite still has the navigable Core path.
 */
export const resolveSuiteContextForDeploymentLink = (
  snapshot: SuiteSnapshot | null | undefined,
  liveSuite: TestSuite | null | undefined,
): SuiteContext => {
  const base = snapshot ?? liveSuite;
  if (!base) {
    return null;
  }

  if (isAssetMcpDeploymentId(liveSuite?.mcpDeploymentRef?.id) && liveSuite?.mcpDeploymentRef) {
    return {
      ...base,
      suiteType: SuiteType.McpTool,
      mcpDeploymentRef: liveSuite.mcpDeploymentRef,
    };
  }

  return base;
};

/** Application / MCP deployment display name from a suite snapshot or live suite. */
export const getSuiteApplicationName = (suiteContext: SuiteContext): string =>
  suiteContext?.deploymentRef?.name ||
  (suiteContext?.suiteType === SuiteType.McpTool ? (suiteContext?.mcpDeploymentRef?.name ?? '') : '') ||
  suiteContext?.mcpDeploymentRef?.name ||
  '';

/** Resolves the external-link target for a run's suite deployment (application, model, or MCP). */
export const resolveRunDeployment = (
  suiteContext: SuiteContext,
  deploymentType: string | undefined,
  modelRoute?: ApplicationRoute,
): RunDeployment | null => {
  if (!suiteContext) {
    return null;
  }

  const isMcp =
    suiteContext.suiteType === SuiteType.McpTool ||
    (!!suiteContext.mcpDeploymentRef?.name && !suiteContext.deploymentRef?.id);

  if (isMcp && suiteContext.mcpDeploymentRef?.name) {
    const navigationTarget = resolveMcpDeploymentNavigationTarget(suiteContext.mcpDeploymentRef);
    if (!navigationTarget) {
      return null;
    }
    return {
      name: suiteContext.mcpDeploymentRef.name,
      route: navigationTarget.route,
      entity: navigationTarget.entity,
    };
  }
  if (suiteContext.deploymentRef?.name && suiteContext.deploymentRef?.id && deploymentType) {
    const navigationTarget = resolveDeploymentNavigationTarget(suiteContext.deploymentRef, deploymentType, [], {
      modelRoute,
    });
    if (!navigationTarget) {
      return null;
    }
    return {
      name: suiteContext.deploymentRef.name,
      route: navigationTarget.route,
      entity: navigationTarget.entity,
    };
  }
  return null;
};
