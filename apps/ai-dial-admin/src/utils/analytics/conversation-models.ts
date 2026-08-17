import { EMBEDDING_NAME_MARKER, MODEL_EXCLUDED_RESOURCE_PREFIXES } from '@/src/constants/analytics/conversations-trace';

const isResourcePath = (deployment: string): boolean =>
  MODEL_EXCLUDED_RESOURCE_PREFIXES.some((prefix) => deployment.startsWith(prefix));

const isEmbedding = (deployment: string): boolean => deployment.toLowerCase().includes(EMBEDDING_NAME_MARKER);

const wrapsAnother = (deployment: string, deployments: string[]): boolean =>
  deployments.some((other) => other !== deployment && deployment.includes(other));

export const narrowToModels = (deployments: string[] = []): string[] => {
  const narrowed = deployments.filter(
    (deployment) => !isResourcePath(deployment) && !isEmbedding(deployment) && !wrapsAnother(deployment, deployments),
  );

  return narrowed.length ? narrowed : deployments;
};
