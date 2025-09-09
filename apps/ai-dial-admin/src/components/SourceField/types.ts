export enum SOURCE_TYPE {
  ENDPOINTS = 'endpoints',
  CONTAINER = 'container',
  RUNNER = 'runner',
  ADAPTER = 'adapter',
}

export interface SOURCE_FIELD {
  $type: SOURCE_TYPE;
  runnerName?: string;
  adapterName?: string;
  containerId?: string;
  endpointDeploymentName?: string;
  completionEndpointPath?: string;
  configurationEndpointPath?: string;
  endpoint?: string;
}
