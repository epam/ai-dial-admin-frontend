export interface DialBaseNamedEntity {
  name?: string;
  description?: string;
  version?: string;
}

export interface DialBaseEntity extends DialBaseNamedEntity {
  endpoint?: string;
  adapter?: string;
  baseEndpoint?: string;
  displayName?: string;
  iconUrl?: string;
  isPublic?: boolean;
  displayVersion?: string;
  roleLimits?: DialRoleLimitsMap;
  defaultRoleLimit?: DialRoleLimits;
  forwardAuthToken?: boolean;
  inputAttachmentTypes?: string[];
  topics?: string[];
  maxInputAttachments?: number | string;
  interceptors?: string[];
  features?: DialFeatures;
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
  temperatureSupported: boolean;
}
