export enum SOURCE_TYPE {
  ENDPOINTS = 'endpoints',
  CONTAINER = 'container',
  RUNNER = 'runner',
}

export interface SOURCE_FIELD {
  $type: SOURCE_TYPE;
  runnerName?: string;
  containerId?: string;
  completionEndpointPath?: string;
  configurationEndpointPath?: string;
  endpoint?: string;
}
