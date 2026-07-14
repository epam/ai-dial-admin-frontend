import { Deployment } from '@/src/models/evaluation/deployment';
import { SuiteType, TestSuite } from '@/src/models/evaluation/test-suite';
import { TargetTab } from './types';

export function buildDeploymentUpdate(data: Deployment): Partial<TestSuite> {
  return {
    suiteType: SuiteType.Deployment,
    deploymentRef: {
      id: data.deploymentId,
      name: data.displayName,
      version: data.version,
      type: data.$type,
    },
    endpointRef: void 0,
    mcpDeploymentRef: void 0,
    toolRef: void 0,
    argumentTemplate: void 0,
  };
}

export function buildMcpDeploymentUpdate(deployment: Deployment): Partial<TestSuite> {
  return {
    suiteType: SuiteType.McpTool,
    mcpDeploymentRef: {
      id: deployment.deploymentId,
      type: deployment.$type,
      name: deployment.displayName || deployment.deploymentId,
    },
    deploymentRef: void 0,
    endpointRef: void 0,
    requestTemplate: void 0,
    toolRef: void 0,
  };
}

export function getInitialTab(suiteType?: SuiteType): TargetTab {
  if (suiteType === SuiteType.McpTool) return TargetTab.Mcp;
  return TargetTab.Applications;
}
