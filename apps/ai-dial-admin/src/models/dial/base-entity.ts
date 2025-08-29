export interface DialBaseNamedEntity {
  name?: string;
  displayName?: string;
  description?: string;
  version?: string;
  endpoint?: string;
}

export interface DialBaseEntity extends DialBaseNamedEntity {
  createdAt?: number;
  updatedAt?: number;
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
  inputAttachmentTypes?: string[];
  topics?: string[];
  fieldsHashingOrder?: string[];
  maxInputAttachments?: number | string;
  interceptors?: string[];
  features?: DialFeatures;
  dependencies?: string[];
  defaults?: Record<string, DefaultsValue>;
  defaultsTemp?: DefaultTemp[];
}

export interface DefaultTemp {
  key: string;
  value: DefaultsValue;
}

export type DefaultsValue = string | number | boolean;

export type DialRoleLimitsMap = Record<string, DialRoleLimits>;
export type DialRoleShareMap = Record<string, DialRoleShare>;

export interface DialRoleLimits {
  day?: string | null;
  minute?: string | null;
  week?: string | null;
  month?: string | null;
}

export interface DialRoleShare {
  invitationTtl?: string | null;
  maxAcceptedUsers?: string | null;
}

export interface DialFeatures {
  truncatePromptEndpoint: string;
  rateEndpoint: string;
  configurationEndpoint: string;
  tokenizeEndpoint: string;
  toolsSupported: boolean;
  systemPromptSupported: boolean;
  urlAttachmentsSupported: boolean;
  folderAttachmentsSupported: boolean;
  seedSupported: boolean;
  allowResume: boolean;
  addonsSupported: boolean;
  temperatureSupported: boolean;
  accessibleByPerRequestKey: boolean;
  parallelToolCallsSupported: boolean;
  contentPartsSupported: boolean;
  cacheSupported: boolean;
  autoCachingSupported: boolean;
  consentRequired: boolean;
}
