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
  completionEndpointPath?: string | null;
  configurationEndpointPath?: string;
}
