import { EnvironmentVariable } from '@/src/models/deployments/variables';
import { Container, ContainerRedeploySnapshot, ResourcesDefaults } from '@/src/models/deployments/containers';
import {
  CONTAINER_STATUS,
  CONTAINER_TRANSPORT,
  CONTAINER_TYPE,
  ContainerResources,
  MODEL_FORMAT,
  MODEL_SOURCE_TYPE,
} from '@/src/types/deployments/containers';
import { DEFAULT_SCALING } from '@/src/constants/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';

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

export const getContainerTypeByRoute = (route: ApplicationRoute): CONTAINER_TYPE => {
  switch (route) {
    case ApplicationRoute.McpContainers:
      return CONTAINER_TYPE.MCP;
    case ApplicationRoute.InterceptorContainers:
      return CONTAINER_TYPE.INTERCEPTOR;
    case ApplicationRoute.AdapterContainers:
      return CONTAINER_TYPE.ADAPTER;
    default:
      return CONTAINER_TYPE.MCP;
  }
};

export const getContainerTemplate = (type: CONTAINER_TYPE, defaults?: ResourcesDefaults): Container | null => {
  if (!type) {
    return null;
  }

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

  if (type === CONTAINER_TYPE.NIM) {
    return {
      ...template,
      source: {
        $type: MODEL_SOURCE_TYPE.NIM,
      },
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

export const convertMilliCoresToCores = (value?: string): string => {
  return String(parseFloat((Number(value) / 1000).toFixed(3)));
};

export const convertCoresToMilliCores = (value?: string): string => {
  return String(Math.round(Number(value) * 1000));
};

export const convertMbToBytes = (value?: string): string => {
  return String(Math.round(Number(value) * (1024 * 1024)));
};

export const convertBytesToMb = (value?: string): string => {
  return String(Math.round(Number(value) / (1024 * 1024)));
};

export const isErrorPresent = (errors: Map<string, boolean>, errorKeys: string[]) => {
  return [...errors].some(([key, value]) => errorKeys.some((errorKey) => key.includes(errorKey)) && !value);
};
