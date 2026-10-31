import { OrgUnit } from '@/src/models/dial/org-unit';

/** `READ_ONLY` is declared ahead of Core: it does not emit it yet, so it never occurs today. */
export enum AdminAccess {
  FULL = 'FULL',
  NONE = 'NONE',
  READ_ONLY = 'READ_ONLY',
}

export enum UnitAction {
  READ = 'read',
  WRITE = 'write',
}

/** The words Core's role definitions use for what a unit owns. */
export enum UnitNamespace {
  APPLICATIONS = 'applications',
  TOOLSETS = 'toolsets',
  PROMPTS = 'prompts',
  FILES = 'files',
  SKILLS = 'skills',
  CONVERSATIONS = 'conversations',
  PUBLICATIONS = 'publications',
  ROLE_ASSIGNMENTS = 'role-assignments',
  ORG_UNITS = 'org-units',
}

export enum AccessMode {
  FULL = 'full',
  UNIT = 'unit',
  DENIED = 'denied',
}

/** A unit the caller works in; `roles` and `permissions` are empty for a unit seen only through `member` above it. */
export interface UserOrgUnit extends OrgUnit {
  roles: string[];
  permissions: Record<string, UnitAction[]>;
}

export interface UserAccess {
  mode: AccessMode;
  adminAccess: AdminAccess;
  units: UserOrgUnit[];
}
