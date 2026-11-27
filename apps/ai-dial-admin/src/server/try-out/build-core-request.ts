import { TRY_OUT_INTERFACES } from '@/src/components/TryOut/Deployment/constants';
import { DeploymentTryOutRequest } from '@/src/components/TryOut/Deployment/models';
import { DeploymentInterfaceType } from '@/src/models/dial/interfaces';
import { BLOCKED_REQUEST_HEADERS, CORE_INTERFACE_PATHS } from './constants';

/** A deployment id spans slashes on Core, so a `.` or `..` segment would climb out of the deployments path. */
const isSafeDeploymentId = (deployment: string): boolean =>
  deployment.split('/').every((segment) => segment.trim() !== '' && segment !== '.' && segment !== '..');

export const isTryOutInterface = (value: unknown): value is DeploymentInterfaceType =>
  TRY_OUT_INTERFACES.includes(value as DeploymentInterfaceType);

/** Interfaces whose Core path names the deployment, so a request for one needs a usable deployment id. */
const PATH_NAMED_INTERFACES = [DeploymentInterfaceType.OpenAIChatCompletions, DeploymentInterfaceType.OpenAIEmbeddings];

/** `null` for an interface Try out does not call, or one whose path names the deployment without a usable id. */
export const getCorePath = (type: unknown, deployment: unknown): string | null => {
  if (!isTryOutInterface(type)) {
    return null;
  }
  const isDeploymentNamed = typeof deployment === 'string' && isSafeDeploymentId(deployment);
  if (PATH_NAMED_INTERFACES.includes(type) && !isDeploymentNamed) {
    return null;
  }

  return CORE_INTERFACE_PATHS[type]?.(isDeploymentNamed ? (deployment as string) : '') ?? null;
};

/** The caller's headers minus the ones it may not set, with empty names and non-string values dropped. */
export const filterRequestHeaders = (headers: DeploymentTryOutRequest['headers']): Record<string, string> =>
  Object.fromEntries(
    Object.entries(headers ?? {}).filter(
      ([name, value]) =>
        name.trim() !== '' && typeof value === 'string' && !BLOCKED_REQUEST_HEADERS.has(name.trim().toLowerCase()),
    ),
  );

export const buildQueryString = (query: DeploymentTryOutRequest['query']): string => {
  const params = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([name, value]) => {
    if (name.trim() !== '' && typeof value === 'string') {
      params.append(name, value);
    }
  });
  const queryString = params.toString();

  return queryString ? `?${queryString}` : '';
};
