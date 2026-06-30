import { ExternalRegistryRef } from '@/src/types/deployments/mcp-registry';

export enum CONTAINER_STATUS {
  RUNNING = 'running',
  PENDING = 'pending',
  NOT_DEPLOYED = 'not_deployed',
  FAILED = 'crashed',
  STOPPED = 'stopped',
  STOPPING = 'stopping',
}

export enum KubEventType {
  NORMAL = 'normal',
  WARNING = 'warning',
}

export enum CONTAINER_TRANSPORT {
  SSE = 'sse',
  HTTP = 'http_streaming',
}

export enum CONTAINER_TYPE {
  MCP = 'mcp',
  INTERCEPTOR = 'interceptor',
  NIM = 'nim',
  HF = 'inference',
  ADAPTER = 'adapter',
  APPLICATION = 'application',
}

export enum CreateSteps {
  IMAGE = 'image',
  PROPERTIES = 'properties',
}

export enum INFERENCE_TASK {
  TEXT_GENERATION = 'TEXT_GENERATION',
  TEXT_CLASSIFICATION = 'TEXT_CLASSIFICATION',
  NONE = 'NONE',
}

export enum CONTAINER_SOURCE_TYPE {
  INTERNAL_IMAGE = 'internal_image',
  IMAGE_REFERENCE = 'image_reference',
  NGC_REGISTRY = 'ngc_registry',
  HUGGINGFACE = 'huggingface',
}

export enum MODEL_TYPE {
  NIM = 'nim',
  HF = 'inference',
}

export enum SCALING_STRATEGY_TYPE {
  REQUESTS = 'active_requests',
  HARDWARE = 'hardware_usage',
}

export type ContainerSource = {
  $type: CONTAINER_SOURCE_TYPE;
  imageDefinitionId?: string;
  imageReference?: string;
  imageRef?: string;
  modelName?: string;
  externalRegistryRef?: ExternalRegistryRef;
};

export enum MODEL_FORMAT {
  HF = 'huggingface',
}

export interface ContainerResources {
  limits?: Record<string, string | undefined>;
  requests?: Record<string, string | undefined>;
}

export enum PROBE_TYPE {
  HTTP_GET = 'httpGet',
  TCP = 'tcpSocket',
}
