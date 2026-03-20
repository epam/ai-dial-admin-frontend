import { EnvironmentVariable } from '@/src/models/deployments/variables';
import { Container, ContainerRedeploySnapshot, ResourcesDefaults } from '@/src/models/deployments/containers';
import {
  CONTAINER_SOURCE_TYPE,
  CONTAINER_STATUS,
  CONTAINER_TRANSPORT,
  CONTAINER_TYPE,
  ContainerResources,
  MODEL_FORMAT,
} from '@/src/types/deployments/containers';
import { DEFAULT_SCALING, DEFAULT_STRATEGY } from '@/src/constants/deployments/containers';
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
    source: container.source,
    containerPorts: normalizeContainerPorts(container.containerPorts),
    containerPort: container.containerPort,
    containerGrpcPort: container.containerGrpcPort,
    envs: normalizeEnvironmentVariables(container.metadata?.envs),
    resources: normalizeResources(container.resources),
    command: container.command,
    args: container.args,
    scaling: container.scaling,
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

export interface ContainerTemplateOptions {
  mcpRegistry?: boolean;
}

export const getContainerTemplate = (
  type: CONTAINER_TYPE,
  defaults?: ResourcesDefaults,
  sourceType?: CONTAINER_SOURCE_TYPE,
  options?: ContainerTemplateOptions,
): Container | null => {
  if (!type) {
    return null;
  }

  const template = {
    $type: type,
    source: { $type: CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE, imageDefinitionId: '' },
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
      ...(sourceType === CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE
        ? {
            source: {
              $type: CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE,
              imageReference: '',
              ...(options?.mcpRegistry ? { externalRegistryRef: { $type: 'mcp-registry', packageName: '' } } : {}),
            },
          }
        : {}),
      transport: CONTAINER_TRANSPORT.HTTP,
      scaling: DEFAULT_SCALING,
    };
  }

  if (
    (type === CONTAINER_TYPE.ADAPTER || type === CONTAINER_TYPE.INTERCEPTOR) &&
    sourceType === CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE
  ) {
    return {
      ...template,
      source: { $type: CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE, imageReference: '' },
      scaling: DEFAULT_SCALING,
    };
  }

  if (type === CONTAINER_TYPE.HF) {
    return {
      ...template,
      source: {
        $type: CONTAINER_SOURCE_TYPE.HUGGINGFACE,
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
        $type: CONTAINER_SOURCE_TYPE.NGC_REGISTRY,
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

  return { ...template, scaling: DEFAULT_SCALING };
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

export const isAutoscalingEnabled = (min?: number, max?: number): boolean => {
  return (max ?? 0) > (min ?? 0) && (max ?? 0) > 1;
};

export const deriveScaling = (
  scaling: Container['scaling'],
  updates: Partial<NonNullable<Container['scaling']>>,
): NonNullable<Container['scaling']> => {
  const merged = { ...scaling, ...updates };
  const min = merged.minReplicas;
  const max = merged.maxReplicas;

  if (isAutoscalingEnabled(min, max)) {
    if (!merged.strategy) {
      merged.strategy = DEFAULT_STRATEGY;
    }
  } else {
    delete merged.strategy;
  }

  return merged;
};
