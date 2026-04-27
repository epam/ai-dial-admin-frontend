export enum IMAGE_STATUS {
  BUILT = 'build_successful',
  BUILDING = 'building',
  NOT_BUILT = 'not_built',
  BUILD_FAILED = 'build_failed',
  BUILD_STOPPED = 'build_stopped',
}

export enum IMAGE_SOURCE_TYPE {
  DOCKER = 'docker',
  CODE = 'git',
}

export enum IMAGE_TYPE {
  MCP = 'mcp',
  INTERCEPTOR = 'interceptor',
  ADAPTER = 'adapter',
  APPLICATION = 'application',
}

export enum IMAGE_TRANSPORT_TYPE {
  LOCAL = 'local',
  REMOTE = 'remote',
}

export enum IMAGE_BUILDER_TYPE {
  ROOTLESS = 'buildkit_rootless',
  ROOT = 'buildkit',
}

export enum DUPLICATION_TYPE {
  VERSION = 'version',
  ENTITY = 'entity',
}
