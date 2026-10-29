export interface OrgUnit {
  id: string;
  name: string;
  displayName: string;
  /** Decoded address in the Units API, without a trailing slash. */
  path: string;
  /** Url-encoded folder with a trailing slash; the only form to match against tree nodes. */
  folder: string;
  author?: string;
  createdAt?: number;
  items?: OrgUnit[];
}

export interface OrgUnitList {
  items?: OrgUnit[];
}

export interface OrgUnitRole {
  name: string;
  description?: string;
  system?: boolean;
}

export interface OrgUnitRoleList {
  items?: OrgUnitRole[];
}

export interface OrgUnitSubject {
  type: 'claimsPredicate';
  source: string;
  function: OrgUnitSubjectFunction;
  targets?: string[];
}

export enum OrgUnitSubjectFunction {
  EQUAL = 'EQUAL',
  TRUE = 'TRUE',
}

export interface OrgUnitRoleAssignment {
  id: string;
  roleName: string;
  subject: OrgUnitSubject;
}

export interface OrgUnitRoleAssignmentList {
  items?: OrgUnitRoleAssignment[];
}

export interface NewOrgUnit {
  name: string;
  displayName?: string;
}

export interface NewOrgUnitRoleAssignment {
  roleName: string;
  subject: OrgUnitSubject;
}

export interface OrgUnitDeleteResponse {
  removed: string[];
}

export interface OrgUnitAssignmentDeleteResponse {
  removed: string;
}

export enum SubjectKind {
  PERSON = 'person',
  GROUP = 'group',
  EVERYONE = 'everyone',
  DIAL_ROLE = 'dialRole',
  RAW = 'raw',
}

export enum OrgUnitsStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  READY = 'ready',
  DISABLED = 'disabled',
  ERROR = 'error',
}
