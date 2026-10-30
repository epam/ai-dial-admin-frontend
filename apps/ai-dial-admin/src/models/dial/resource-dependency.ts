export enum ResourceAccess {
  Read = 'READ',
  Write = 'WRITE',
}

export interface ResourceDependencyTarget {
  path: string;
}

export interface ResourceDependency {
  kind: string;
  link_id: string;
  target: ResourceDependencyTarget;
  access: ResourceAccess[];
  required: boolean;
}

export interface ApprovedResource {
  path: string;
  access: ResourceAccess[];
}

/**
 * Core's admin-consent read. `consented` is "live right now"; `stale` marks a record that no longer
 * matches the saved declaration. Provenance and `grantedResources` are present whenever a record exists.
 */
export interface AdminConsentStatus {
  consented: boolean;
  stale?: boolean;
  grantedBy?: string;
  grantedAt?: number;
  grantedResources?: ApprovedResource[];
}
