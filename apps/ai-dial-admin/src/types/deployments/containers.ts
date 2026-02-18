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
}

export enum CreateSteps {
  IMAGE = 'image',
  PROPERTIES = 'properties',
}

export enum MODEL_SOURCE_TYPE {
  NIM = 'ngc_registry',
  HF = 'huggingface',
}

export enum MODEL_TYPE {
  NIM = 'nim',
  HF = 'inference',
}

export enum SCALING_STRATEGY_TYPE {
  REQUESTS = 'active_requests',
  HARDWARE = 'hardware_usage',
}

export type SERVING_SOURCE = {
  $type: MODEL_SOURCE_TYPE;
  imageRef?: string;
  modelName?: string;
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
