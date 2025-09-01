import { DialFeatures } from '@/src/models/dial/features';
import { DefaultsValue, DefaultTemp } from '@/src/models/dial/defaults';
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
  topics?: string[];

  // for models, applications

  // for models, applications, toolsets
  maxRetryAttempts?: number;
}

export interface EntityAttachment {
  maxInputAttachments?: number | string;
  inputAttachmentTypes?: string[];
}
// export interface DialBaseEntity extends BaseEntity, ModifiedEntity {
//   adapter?: string;
//   isPublic?: boolean;
//   roleLimits?: DialRoleLimitsMap;
//   roleShareResourceLimits?: DialRoleShareMap;
//   defaultRoleLimit?: DialRoleLimits;
//   defaultRoleShareResourceLimit?: DialRoleShare;
//   forwardAuthToken?: boolean;

//   fieldsHashingOrder?: string[];
//   interceptors?: string[];
//   dependencies?: string[];
// }
