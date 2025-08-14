export interface DialBaseNamedEntity {
  name?: string;
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
  defaultRoleLimit?: DialRoleLimits;
  forwardAuthToken?: boolean;
  inputAttachmentTypes?: string[];
  topics?: string[];
  fieldsHashingOrder?: string[];
  maxInputAttachments?: number | string;
  interceptors?: string[];
  features?: DialFeatures;
  dependencies?: string[];
}

export type DialRoleLimitsMap = Record<string, DialRoleLimits>;

export interface DialRoleLimits {
  day?: string | null;
  minute?: string | null;
  week?: string | null;
  month?: string | null;
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
