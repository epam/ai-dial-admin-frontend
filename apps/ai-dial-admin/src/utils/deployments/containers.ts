import {
  getAdapterContainers,
  getApplicationContainers,
  getInterceptorContainers,
  getMCPContainers,
  getModelContainers,
} from '@/src/app/actions/deployments';
import { EnvironmentVariable } from '@/src/models/deployments/variables';
import {
  Autoscaling,
  Container,
  ContainerRedeploySnapshot,
  ResourcesDefaults,
} from '@/src/models/deployments/containers';
import { ServerActionResponse } from '@/src/models/server-action';
import {
  CONTAINER_SOURCE_TYPE,
  CONTAINER_STATUS,
  CONTAINER_TRANSPORT,
  CONTAINER_TYPE,
  ContainerResources,
  ContainerSource,
  MODEL_FORMAT,
} from '@/src/types/deployments/containers';
import { DEFAULT_SCALING, DEFAULT_STRATEGY, SERVING_SCALING } from '@/src/constants/deployments/containers';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { SourceI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { getTranslatedType } from '@/src/utils/deployments/entity';

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
    nodePoolId: container.nodePoolId ?? null,
    nodePoolName: container.nodePoolName ?? null,
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
    case ApplicationRoute.ApplicationContainers:
      return CONTAINER_TYPE.APPLICATION;
    default:
      return CONTAINER_TYPE.MCP;
  }
};

export interface ContainerTemplateOptions {
  mcpRegistry?: boolean;
}

export const getContainerScaling = (type: CONTAINER_TYPE): Autoscaling => {
  if (type === CONTAINER_TYPE.NIM || type === CONTAINER_TYPE.HF) {
    return SERVING_SCALING;
  }
  return DEFAULT_SCALING;
};

export const getContainerResources = (type: CONTAINER_TYPE, defaults?: ResourcesDefaults): ContainerResources => {
  const base: ContainerResources = {
    requests: {
      cpu: defaults?.CPU_REQUEST || '1',
      memory: `${(Number(defaults?.MEMORY_REQUEST) || 2048) * 1024 * 1024}`,
    },
    limits: {
      cpu: defaults?.CPU_LIMIT || '1',
      memory: `${(Number(defaults?.MEMORY_LIMIT) || 2048) * 1024 * 1024}`,
    },
  };

  if (type === CONTAINER_TYPE.NIM || type === CONTAINER_TYPE.HF) {
    return {
      requests: {
        ...base.requests,
        'nvidia.com/gpu': defaults?.GPU_REQUEST || '1',
      },
      limits: {
        ...base.limits,
        'nvidia.com/gpu': defaults?.GPU_LIMIT || '1',
      },
    };
  }

  return base;
};

export const getContainerSource = (
  type: CONTAINER_TYPE,
  sourceType?: CONTAINER_SOURCE_TYPE,
  options?: ContainerTemplateOptions,
): ContainerSource => {
  if (type === CONTAINER_TYPE.NIM) {
    return { $type: CONTAINER_SOURCE_TYPE.NGC_REGISTRY };
  }

  if (type === CONTAINER_TYPE.HF) {
    return { $type: CONTAINER_SOURCE_TYPE.HUGGINGFACE };
  }

  if (sourceType === CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE) {
    return {
      $type: CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE,
      imageReference: '',
      ...(options?.mcpRegistry ? { externalRegistryRef: { $type: SOURCE_TYPE.MCP_REGISTRY, packageName: '' } } : {}),
    };
  }

  return { $type: CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE, imageDefinitionId: '' };
};

export const getContainerTemplate = (
  type: CONTAINER_TYPE,
  defaults?: ResourcesDefaults,
  sourceType?: CONTAINER_SOURCE_TYPE,
  options?: ContainerTemplateOptions,
): Container | null => {
  if (!type) {
    return null;
  }

  return {
    $type: type,
    displayName: '',
    name: '',
    description: '',
    status: CONTAINER_STATUS.NOT_DEPLOYED,
    metadata: { envs: [] },
    source: getContainerSource(type, sourceType, options),
    scaling: getContainerScaling(type),
    resources: getContainerResources(type, defaults),
    ...(type === CONTAINER_TYPE.MCP && { transport: CONTAINER_TRANSPORT.HTTP }),
    ...(type === CONTAINER_TYPE.HF && { modelFormat: MODEL_FORMAT.HF }),
  };
};

export const getContainerSourceTypeLabel = (
  source: ContainerSource,
  route: ApplicationRoute,
  t: (key: string, params?: Record<string, string>) => string,
): string => {
  switch (source.$type) {
    case CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE:
      return t(SourceI18nKey.InternalImage, { type: getTranslatedType(route, t) });
    case CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE:
      return t(SourceI18nKey.DockerImage);
    case CONTAINER_SOURCE_TYPE.NGC_REGISTRY:
      return t(SourceI18nKey.NgcRegistry);
    case CONTAINER_SOURCE_TYPE.HUGGINGFACE:
      return t(SourceI18nKey.HuggingFace);
    default:
      return '';
  }
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

export const formatCpuValue = (value: string): string => {
  if (!value || value.endsWith('m')) return value;
  const milli = convertCoresToMilliCores(value);
  return Number.isFinite(Number(milli)) ? `${milli}m` : value;
};

export const formatMemoryValue = (value: string): string => {
  if (!value) return value;
  if (/[A-Za-z]/.test(value)) return value;
  const mb = convertBytesToMb(value);
  return Number.isFinite(Number(mb)) ? `${mb} Mb` : value;
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

/**
 * Returns the list-containers server action that matches the given entity route, or `null`
 * if the route has no container source concept. Supported routes: Models, Applications,
 * Toolsets, Interceptors, Adapters.
 */
export const getContainersByView = (
  view: ApplicationRoute,
): (() => Promise<ServerActionResponse<Container[]>>) | null => {
  switch (view) {
    case ApplicationRoute.Models:
      return getModelContainers;
    case ApplicationRoute.Applications:
      return getApplicationContainers;
    case ApplicationRoute.Toolsets:
      return getMCPContainers;
    case ApplicationRoute.Interceptors:
      return getInterceptorContainers;
    case ApplicationRoute.Adapters:
      return getAdapterContainers;
    default:
      return null;
  }
};
