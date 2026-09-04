import { RunDeployment } from '@/src/components/Runs/View/models';
import { SuiteSnapshot, SuiteType, TestSuite } from '@/src/models/evaluation/test-suite';
import { ApplicationRoute } from '@/src/types/routes';
import { resolveDeploymentNavigationTarget } from '@/src/utils/deployment-navigation';

export type SuiteContext = SuiteSnapshot | TestSuite | null | undefined;

/** Application / MCP deployment display name from a suite snapshot or live suite. */
export const getSuiteApplicationName = (suiteContext: SuiteContext): string =>
  suiteContext?.deploymentRef?.name ||
  (suiteContext?.suiteType === SuiteType.McpTool ? (suiteContext?.mcpDeploymentRef?.name ?? '') : '') ||
  '';

/** Resolves the external-link target for a run's suite deployment (application, model, or MCP). */
export const resolveRunDeployment = (
  suiteContext: SuiteContext,
  deploymentType: string | undefined,
): RunDeployment | null => {
  if (!suiteContext) {
    return null;
  }
  if (suiteContext.suiteType === SuiteType.McpTool && suiteContext.mcpDeploymentRef?.name) {
    return {
      name: suiteContext.mcpDeploymentRef.name,
      route: ApplicationRoute.McpContainers,
      entity: { name: suiteContext.mcpDeploymentRef.id ?? suiteContext.mcpDeploymentRef.name },
    };
  }
  if (suiteContext.deploymentRef?.name && suiteContext.deploymentRef?.id && deploymentType) {
    const navigationTarget = resolveDeploymentNavigationTarget(suiteContext.deploymentRef, deploymentType, []);
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
