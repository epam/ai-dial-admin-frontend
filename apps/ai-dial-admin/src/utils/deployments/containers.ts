import { EnvironmentVariable } from '@/src/models/deployments/variables';
import { Container, ContainerRedeploySnapshot, ResourcesDefaults } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import {
  CONTAINER_STATUS,
  CONTAINER_TRANSPORT,
  CONTAINER_TYPE,
  ContainerResources,
  MODEL_FORMAT,
  MODEL_SOURCE_TYPE,
} from '@/src/types/deployments/containers';
import { DEFAULT_SCALING } from '@/src/constants/deployments/containers';

export const normalizeContainerPorts = (ports?: number[]): number[] => {
  return [...(ports ?? [])].slice().sort((a, b) => a - b);
};

export const normalizeEnvironmentVariables = (envs?: EnvironmentVariable[]): EnvironmentVariable[] => {
  return [...(envs ?? [])].slice().sort((a, b) => {
    const nameCmp = (a?.name ?? '').localeCompare(b?.name ?? '');
    if (nameCmp !== 0) return nameCmp;
    return String(a.mountType).localeCompare(String(b.mountType));
  });
};

const normalizeResources = (resources?: ContainerResources): ContainerResources => {
  return {
    requests: { ...(resources?.requests ?? {}) },
    limits: { ...(resources?.limits ?? {}) },
  };
};

export const getContainerRedeploySnapshot = (container: Container): ContainerRedeploySnapshot => {
  return {
    imageDefinitionId: container.imageDefinitionId,
    containerPorts: normalizeContainerPorts(container.containerPorts),
    containerPort: container.containerPort,
    containerGrpcPort: container.containerGrpcPort,
    envs: normalizeEnvironmentVariables(container.metadata?.envs),
    resources: normalizeResources(container.resources),
  };
};

export const getContainerTemplate = (route: ApplicationRoute, defaults?: ResourcesDefaults): Container | null => {
  switch (route) {
    case ApplicationRoute.ModelServings:
      return getTemplate(CONTAINER_TYPE.HF, defaults);
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
    displayName: '',
    name: '',
    description: '',
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
      transport: CONTAINER_TRANSPORT.HTTP,
    };
  }

  if (type === CONTAINER_TYPE.HF) {
    return {
      ...template,
      source: {
        $type: MODEL_SOURCE_TYPE.HF,
      },
      modelFormat: MODEL_FORMAT.HF,
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
      scaling: DEFAULT_SCALING,
    };
  }

  return template;
};

export const isEditDisabled = (container: Container): boolean => {
  return container.status === CONTAINER_STATUS.PENDING || container.status === CONTAINER_STATUS.STOPPING;
};
