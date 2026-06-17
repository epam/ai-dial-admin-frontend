import { DialRoleLimits, DialRoleLimitsMap, DialRoleShare, DialRoleShareMap } from '@/src/models/dial/role-limits';
import { DialFeatures } from '@/src/models/dial/features';

export interface ModifiedEntity {
  createdAt?: string;
  updatedAt?: string;
}

export interface BaseEntity extends ModifiedEntity {
  name?: string;
  displayName?: string;
  description?: string;
  topics?: string[];
}

export interface EntityDefaults {
  defaults?: Record<string, unknown>;
  responsesDefaults?: Record<string, unknown>;
}

export interface EntityAttachment {
  maxInputAttachments?: number | string;
  inputAttachmentTypes?: string[];
}

export interface EntityRoleLimits {
  isPublic?: boolean;
  roleLimits?: DialRoleLimitsMap;
  roleShareResourceLimits?: DialRoleShareMap;
  defaultRoleLimit?: DialRoleLimits;
  defaultRoleShareResourceLimit?: DialRoleShare;
}

export interface ChatEntity extends BaseEntity, ModifiedEntity, EntityAttachment, EntityDefaults, EntityRoleLimits {
  iconUrl?: string;
  author?: string;
  features?: DialFeatures;
  forwardAuthToken?: boolean;
  maxRetryAttempts?: number;
  interceptors?: string[];
  endpoint?: string | null;
}

export interface EntityValidityState {
  validityState?: ValidityState;
}

export interface ValidityState {
  message: string;
  valid: boolean;
}
