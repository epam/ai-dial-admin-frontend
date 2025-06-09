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
}
