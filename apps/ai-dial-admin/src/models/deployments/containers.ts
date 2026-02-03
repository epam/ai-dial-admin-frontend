import {
  CONTAINER_STATUS,
  CONTAINER_TRANSPORT,
  CONTAINER_TYPE,
  ContainerResources,
  KubEventType,
  SCALING_STRATEGY_TYPE,
  SERVING_SOURCE,
} from '@/src/types/deployments/containers';
import { EnvironmentVariable } from '@/src/models/deployments/variables';

export interface Container {
  $type: CONTAINER_TYPE;
  name: string;
  displayName: string;
  imageDefinitionId: string;
  description?: string;
  containerPorts?: number[];
  containerPort?: number;
  containerGrpcPort?: number;
  resources?: ContainerResources;
  status: CONTAINER_STATUS;
  url?: string;
  createdAt?: number;
  updatedAt?: number;
  author?: string;
  mcpEndpointPath?: string | null;
  transport?: CONTAINER_TRANSPORT;
  metadata: {
    envs?: EnvironmentVariable[];
  };
  source?: SERVING_SOURCE;
  modelFormat?: string;
  command?: string;
  args?: string;
  scaling?: Autoscaling;
  allowedDomains?: string[];
}

export interface Autoscaling {
  minReplicas?: number;
  maxReplicas?: number;
  scaleToZeroDelaySeconds?: number;
  strategy?: AutoscalingStrategy;
}

export interface AutoscalingStrategy {
  $type: SCALING_STRATEGY_TYPE;
  threshold?: number;
}

export interface Resource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface Prompt {
  name: string;
  description?: string;
  arguments?: Argument[];
}

export interface Argument {
  name: string;
  description?: string;
  required?: boolean;
}

export interface Pod {
  name: string;
  createdAt: number;
  restartCount?: number;
  lastTerminationReason?: string;
  lastExitCode?: string;
  lastFinishedAt?: number;
}

export interface ResourcesDefaults {
  CPU_REQUEST?: string;
  CPU_LIMIT?: string;
  MEMORY_REQUEST?: string;
  MEMORY_LIMIT?: string;
  GPU_REQUEST?: string;
  GPU_LIMIT?: string;
}

export interface KubEvent {
  count: number;
  id: string;
  deploymentId: string;
  eventType: KubEventType;
  firstTimestamp: number;
  message: string;
  reason: string;
  source: string;
  involvedObjectKind: string;
  involvedObjectName: string;
  involvedObjectNamespace: string;
}

export interface ContainerRedeploySnapshot {
  imageDefinitionId: string;
  containerPorts: number[];
  containerPort?: number;
  containerGrpcPort?: number;
  envs: EnvironmentVariable[];
  resources?: ContainerResources;
  allowedDomains?: string[];
}
