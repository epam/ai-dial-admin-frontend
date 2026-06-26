// Serving-engine families recognized by the deployment-manager metrics endpoint.
export enum MetricsEngineFamily {
  VLLM = 'VLLM',
  TGI = 'TGI',
  SGLANG = 'SGLANG',
  KSERVE_MODELSERVER = 'KSERVE_MODELSERVER',
  UNKNOWN = 'UNKNOWN',
}

// Keys of the per-block availability map in the metrics snapshot.
export enum MetricsBlockKey {
  Serving = 'serving',
  Operational = 'operational',
  Resources = 'resources',
  ResourcesUsage = 'resources.usage',
  ResourcesGpu = 'resources.gpu',
}
