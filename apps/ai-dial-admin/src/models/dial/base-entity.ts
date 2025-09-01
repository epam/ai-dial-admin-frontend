import { DefaultsValue, DefaultTemp } from '@/src/models/dial/defaults';
import { DialRoleLimits, DialRoleLimitsMap, DialRoleShare, DialRoleShareMap } from '@/src/models/dial/role-limits';
import { DialFeatures } from '@/src/models/dial/features';

export interface DialBaseNamedEntity {
  name?: string;
  displayName?: string;
  description?: string;
  version?: string;
  endpoint?: string | null;
}

export interface DialBaseEntity extends DialBaseNamedEntity, EntityAttachment {
  createdAt?: string;
  updatedAt?: string;
  adapter?: string;
  author?: string;
  baseEndpoint?: string;
  displayName?: string;
  iconUrl?: string;
  isPublic?: boolean;
  roleLimits?: DialRoleLimitsMap;
  roleShareResourceLimits?: DialRoleShareMap;
  defaultRoleLimit?: DialRoleLimits;
  defaultRoleShareResourceLimit?: DialRoleShare;
  forwardAuthToken?: boolean;
  topics?: string[];
  fieldsHashingOrder?: string[];
  interceptors?: string[];
  features?: DialFeatures;
  dependencies?: string[];
  defaults?: Record<string, DefaultsValue>;
  defaultsTemp?: DefaultTemp[];
}

export interface EntityAttachment {
  maxInputAttachments?: number | string;
  inputAttachmentTypes?: string[];
}
