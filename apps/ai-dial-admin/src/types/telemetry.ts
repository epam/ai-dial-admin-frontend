export type FilterQuery = Record<string, unknown>;

export enum FILTER_OPERATOR {
  Contain = 'Contain',
  NotContains = 'NotContains',
  Equal = 'Equal',
  NotEqual = 'NotEqual',
  StartsWith = 'StartsWith',
  EndsWith = 'EndsWith',
}

export enum FILTER_TYPE {
  Entity = 'Entity',
  Project = 'Project',
  Mcp = 'Mcp',
}

export enum DASHBOARD_VIEW_TYPE {
  Chat = 'Chat',
  Mcp = 'Mcp',
}

export enum ACTIVITY_VIEW_TYPE {
  Config = 'Config',
  Asset = 'Asset',
}
