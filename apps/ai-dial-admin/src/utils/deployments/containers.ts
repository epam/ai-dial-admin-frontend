import { EnvironmentVariable } from '@/src/models/deployments/variables';
import { getPathError, getVariableNameError } from '@/src/utils/deployments/validation';
import { Container, ContainerRedeploySnapshot, ResourcesDefaults } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorForName } from '@/src/utils/validation/name-error';
import { CONTAINER_STATUS, CONTAINER_TRANSPORT, CONTAINER_TYPE } from '@/src/types/deployments/containers';

export const normalizeContainerPorts = (ports?: number[]): number[] => {
  return [...(ports ?? [])].slice().sort((a, b) => a - b);
};

export const normalizeEnvironmentVariables = (envs?: EnvironmentVariable[]): EnvironmentVariable[] => {
  return [...(envs ?? [])].slice().sort((a, b) => {
    const aName = a?.name ?? '';
    const bName = b?.name ?? '';
    const nameCmp = aName.localeCompare(bName);
    if (nameCmp !== 0) return nameCmp;
    const aMountType = String(a?.mountType ?? '');
    const bMountType = String(b?.mountType ?? '');
    return aMountType.localeCompare(bMountType);
  });
};

export const getContainerRedeploySnapshot = (container: Container): ContainerRedeploySnapshot => {
  return {
    imageDefinitionId: container.imageDefinitionId,
    containerPorts: normalizeContainerPorts(container.containerPorts),
    containerPort: container.containerPort,
    containerGrpcPort: container.containerGrpcPort,
    envs: normalizeEnvironmentVariables(container.metadata?.envs),
  };
};

const isValidVariables = (variables: EnvironmentVariable[]) => {
  return variables.every((env) => !getVariableNameError(env.name));
};

export function validateContainer(container: Container, route: ApplicationRoute, names: string[]): boolean {
  if (!container.name?.trim() || names.includes(container.name.trim()) || getErrorForName(container.name, names)) {
    return false;
  }

  if (container.metadata.envs && container.metadata.envs.length) {
    return isValidVariables(container.metadata.envs);
  }
  if (container.mcpEndpointPath && getPathError(container.mcpEndpointPath)) {
    return false;
  }

  if (!container.transport && route === ApplicationRoute.McpDeployments) {
    return false;
  }

  if (route === ApplicationRoute.ModelDeployments) {
    if (
      !(
        container.resources?.requests?.cpu?.trim() &&
        container.resources?.requests?.memory?.trim() &&
        container.resources?.requests?.['nvidia.com/gpu']?.trim() &&
        container.resources?.limits?.cpu?.trim() &&
        container.resources?.limits?.memory?.trim() &&
        container.resources?.limits?.['nvidia.com/gpu']?.trim()
      )
    ) {
      return false;
    }
  }
  return true;
}

export const getContainerTemplate = (route: ApplicationRoute, defaults?: ResourcesDefaults): Container | null => {
  switch (route) {
    case ApplicationRoute.ModelDeployments:
      return getTemplate(CONTAINER_TYPE.MODEL, defaults);
    case ApplicationRoute.McpDeployments:
      return getTemplate(CONTAINER_TYPE.MCP, defaults);
    case ApplicationRoute.InterceptorDeployments:
      return getTemplate(CONTAINER_TYPE.INTERCEPTOR, defaults);
    default:
      return null;
  }
};

const getTemplate = (type: CONTAINER_TYPE, defaults?: ResourcesDefaults): Container => {
  const template = {
    $type: type,
    imageDefinitionId: '',
    name: '',
    status: CONTAINER_STATUS.NOT_DEPLOYED,
    metadata: {
      envs: [],
    },
    resources: {
      requests: {
        cpu: defaults?.CPU_REQUEST || '1',
        memory: `${(Number(defaults?.MEMORY_REQUEST) || 2048) * 1024 * 1024}`,
      },
      limits: {
        cpu: defaults?.CPU_LIMIT || '1',
        memory: `${(Number(defaults?.MEMORY_LIMIT) || 2048) * 1024 * 1024}`,
      },
    },
  };

  if (type === CONTAINER_TYPE.MCP) {
    return {
      ...template,
      transport: CONTAINER_TRANSPORT.SSE,
    };
  }

  if (type === CONTAINER_TYPE.MODEL) {
    return {
      ...template,
      resources: {
        requests: {
          ...template.resources?.requests,
          'nvidia.com/gpu': defaults?.GPU_REQUEST || '1',
        },
        limits: {
          ...template.resources?.limits,
          'nvidia.com/gpu': defaults?.GPU_LIMIT || '1',
        },
      },
    };
  }

  return template;
};
