import { ToolsetTransport } from '@/src/types/toolset';
import { BaseEntity, EntityRoleLimits } from '@/src/models/dial/base-entity';
import { SOURCE_FIELD } from '@/src/components/SourceField/types';

export interface Toolset extends BaseEntity, EntityRoleLimits {
  transport?: ToolsetTransport;
  allowedTools?: string[];
  descriptionKeywords?: string[];
  iconUrl?: string;
  author?: string;
  endpoint?: string | null;
  maxRetryAttempts?: number;
  source?: SOURCE_FIELD;
  authSettings?: ToolsetAuthSettings;
}

export interface ToolsetAuthSettings {
  authenticationType: ToolsetAuthType;
  apiKeyHeader?: string;

  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  scopesSupported?: string[];
}

export enum ToolsetAuthType {
  NONE = 'none',
  API_KEY = 'api_key',
  OAUTH = 'oauth',
}

export interface Tool {
  name: string;
  description: string;
}
