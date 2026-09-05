import { getDeploymentById } from '@/src/app/[lang]/test-suites/actions';

export async function resolveDeploymentType(deploymentId: string): Promise<string | undefined> {
  const deployment = await getDeploymentById(deploymentId);
  return deployment?.$type;
}
