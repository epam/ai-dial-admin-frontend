import { SOURCE_FIELD } from '@/src/components/SourceField/types';
import { BaseEntity, EntityRoleLimits } from '@/src/models/dial/base-entity';
import { ToolsetTransport } from '@/src/types/toolset';

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
  forwardPerRequestKey?: boolean;
}

export interface ToolsetAuthSettings {
  authenticationType: ToolsetAuthType;
  apiKeyHeader?: string;

  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  authorizationEndpoint?: string;
  codeChallenge?: string;
  codeChallengeMethod?: ToolsetCodeChallengeMethod;
  tokenEndpoint?: string;
  scopesSupported?: string[];

  globalAuthStatus?: ToolsetAuthStatus;
  userLevelAuthStatus?: ToolsetAuthStatus;
}

export enum ToolsetCodeChallengeMethod {
  S256 = 'S256',
  PLAIN = 'plain',
}

export enum ToolsetAuthCredentialLevel {
  GLOBAL = 'global',
  USER = 'user',
  APP = 'app',
}

export enum ToolsetAuthStatus {
  SIGNED_OUT = 'signed_out',
  SIGNED_IN = 'signed_in',
  FAILED = 'failed',
}

export enum ToolsetAuthType {
  NONE = 'none',
  API_KEY = 'api_key',
  OAUTH = 'oauth',
}

export interface ToolSchema {
  type: string;
  properties: Record<string, unknown>;
  required?: string[];
}

export interface Tool {
  name: string;
  description?: string;
  inputSchema?: ToolSchema;
  annotations?: {
    title?: string;
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
  outputSchema?: ToolSchema;
}
