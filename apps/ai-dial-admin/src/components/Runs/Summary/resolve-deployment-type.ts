import { getDeployment, getDeployments } from '@/src/app/[lang]/test-suites/actions';
import { DeploymentType } from '@/src/models/evaluation/deployment';

export async function resolveDeploymentType(deploymentId: string): Promise<string | undefined> {
  const [applicationsRes, modelsRes] = await Promise.all([
    getDeployments(DeploymentType.Application),
    getDeployments(DeploymentType.Model),
  ]);

  const fromApplications = applicationsRes?.success
    ? applicationsRes.response?.find((item) => item.deploymentId === deploymentId)
    : undefined;
  const fromModels = modelsRes?.success
    ? modelsRes.response?.find((item) => item.deploymentId === deploymentId)
    : undefined;
  const typeFromList = fromApplications?.$type ?? fromModels?.$type;

  if (typeFromList) {
    return typeFromList;
  }

  const [application, model] = await Promise.all([
    getDeployment(deploymentId, DeploymentType.Application),
    getDeployment(deploymentId, DeploymentType.Model),
  ]);

  if (application) {
    return DeploymentType.Application;
  }

  if (model) {
    return DeploymentType.Model;
  }

  return undefined;
}
