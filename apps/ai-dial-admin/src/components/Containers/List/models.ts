export enum ContainerCreateSource {
  INTERNAL_IMAGE = 'internal-image',
  DOCKER_IMAGE = 'docker-image',
  MCP_REGISTRY = 'mcp-registry',
}

export interface ContainerCreateSourceOption {
  id: ContainerCreateSource;
  name: string;
}
