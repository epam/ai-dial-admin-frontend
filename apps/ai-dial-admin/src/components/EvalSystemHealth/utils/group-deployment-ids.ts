import { ListedDeploymentIds } from '@/src/components/EvalSystemHealth/models';
import { Deployment, DeploymentType } from '@/src/models/evaluation/deployment';

/**
 * Splits one deployment listing into the ids of each evaluatee kind by the item's `$type`. An application
 * that also exposes the MCP interface stays an application; an item of any other type is left out.
 */
export const groupDeploymentIds = (deployments: Deployment[]): ListedDeploymentIds => {
  const grouped: ListedDeploymentIds = { models: [], applications: [], toolsets: [] };
  for (const { $type, deploymentId } of deployments) {
    if ($type === DeploymentType.Model) {
      grouped.models.push(deploymentId);
    } else if ($type === DeploymentType.Application) {
      grouped.applications.push(deploymentId);
    } else if ($type === DeploymentType.Toolset) {
      grouped.toolsets.push(deploymentId);
    }
  }
  return grouped;
};
