export interface DialRule {
  source: string;
  function: RuleFunction;
  targets: string[];
}

// dial-core specific
export enum RuleSource {
  'title' = 'Title',
  'job title' = 'JobTitle',
  'role' = 'Role',
  'dial_roles' = 'DialRoles',
  'groups' = 'Groups',
}

export enum RuleFunction {
  CONTAIN = 'CONTAIN',
  EQUAL = 'EQUAL',
  REGEX = 'REGEX',
}

export interface RuleDiffModel {
  status?: RuleDiffStatus;
  items?: string[];
}

export enum RuleDiffStatus {
  INCLUDE = 'include',
  EXCLUDE = 'exclude',
}
