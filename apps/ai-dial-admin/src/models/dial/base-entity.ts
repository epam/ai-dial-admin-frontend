import { DialFeatures } from '@/src/models/dial/features';
import { DefaultsValue, DefaultTemp } from '@/src/models/dial/default';
import { DialRoleLimits, DialRoleLimitsMap, DialRoleShare, DialRoleShareMap } from '@/src/models/dial/role-limits';

export interface BaseEntity {
  name?: string;
  displayName?: string;
  description?: string;
}

export interface BaseEndpointEntity {
  endpoint?: string | null;
}

export interface ModifiedEntity {
  createdAt?: number;
  updatedAt?: number;
}

// TODO: rename to
export interface ChatEntity extends BaseEntity, ModifiedEntity {
  // for models, applications, interceptors, toolsets
  author?: string;
  iconUrl?: string;
  endpoint?: string | null;

  // for models, applications, interceptors,
  defaults?: Record<string, DefaultsValue>;
  defaultsTemp?: DefaultTemp[];

  // for models, applications, toolsets
  maxInputAttachments?: number | string;
}

export interface DialBaseEntity extends BaseEntity, ModifiedEntity {
  adapter?: string;
  author?: string;
  displayName?: string;
  iconUrl?: string;
  isPublic?: boolean;
  roleLimits?: DialRoleLimitsMap;
  roleShareResourceLimits?: DialRoleShareMap;
  defaultRoleLimit?: DialRoleLimits;
  defaultRoleShareResourceLimit?: DialRoleShare;
  forwardAuthToken?: boolean;
  inputAttachmentTypes?: string[];
  topics?: string[];
  fieldsHashingOrder?: string[];
  maxInputAttachments?: number | string;
  interceptors?: string[];
  features?: DialFeatures;
  dependencies?: string[];
}
