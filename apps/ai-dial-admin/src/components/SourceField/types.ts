export enum SOURCE_TYPE {
  ENDPOINTS = 'endpoints',
  SCHEMA = 'schema',
  CONTAINER = 'container',
  RUNNER = 'runner',
  ADAPTER = 'adapter',
  MCP_REGISTRY = 'mcp-registry',
}

export interface SOURCE_FIELD {
  $type: SOURCE_TYPE;
  runnerName?: string;
  adapterName?: string;
  containerId?: string;
  completionEndpointPath?: string;
  responsesEndpointPath?: string;
  configurationEndpointPath?: string;
  mcpEndpointPath?: string;
  serverName?: string;
  serverVersion?: string;
  applicationTypeSchemaId?: string;
}
