import {
  CONTAINER_STATUS,
  CONTAINER_TRANSPORT,
  CONTAINER_TYPE,
  ContainerResources,
  ContainerSource,
  INFERENCE_TASK,
  KubEventType,
  PROBE_TYPE,
  SCALING_STRATEGY_TYPE,
} from '@/src/types/deployments/containers';
import { EnvironmentVariable } from '@/src/models/deployments/variables';
import { BaseEntity } from '../dial/base-entity';

export interface Container extends BaseEntity {
  $type: CONTAINER_TYPE;
  source: ContainerSource;
  containerPorts?: number[];
  containerPort?: number;
  containerGrpcPort?: number;
  resources?: ContainerResources;
  status: CONTAINER_STATUS;
  url?: string;
  author?: string;
  mcpEndpointPath?: string | null;
  transport?: CONTAINER_TRANSPORT;
  metadata: {
    envs?: EnvironmentVariable[];
  };
  modelFormat?: string;
  inferenceTask?: INFERENCE_TASK;
  command?: string;
  args?: string;
  scaling?: Autoscaling;
  allowedDomains?: string[];
  probeProperties?: ProbeProperties;
  nodePoolId?: string | null;
  nodePoolName?: string | null;
}

export interface ProbeProperties {
  enabled: boolean;
  initialDelaySeconds?: number;
  periodSeconds?: number;
  timeoutSeconds?: number;
  failureThreshold?: number;
  probe?: ProbeConfig;
}

export interface ProbeConfig {
  $type: PROBE_TYPE;
  path?: string;
  port?: number;
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
  lastTerminationMessage?: string;
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
  source: ContainerSource;
  containerPorts: number[];
  containerPort?: number;
  containerGrpcPort?: number;
  envs: EnvironmentVariable[];
  resources?: ContainerResources;
  allowedDomains?: string[];
  command?: string;
  args?: string;
  scaling?: Autoscaling;
  nodePoolId?: string | null;
  nodePoolName?: string | null;
}

export interface HuggingFaceModel {
  id: string;
  author: string;
  createdAt: string;
  lastModified: string;
  datasets: string[];
  downloads: number;
  languages: string[];
  libraries: string[];
  licenses: string[];
  likes: number;
  sha: string;
  tags: string[];
  parameters: number;
}
