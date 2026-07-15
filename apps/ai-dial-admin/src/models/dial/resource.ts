import { BaseEntity, EntityDefaults } from '@/src/models/dial/base-entity';
import { ToolsetTransport } from '@/src/types/toolset';

export interface DialResource extends BaseEntity {
  display_name?: string;
  display_version?: string;
  description_keywords: string[];
  dependencies: string[];
  interceptors: string[];
  path: string;
  folderId: string;
  nodeType?: string;
  version: string;
  author: string;
  endpoint?: string;
  icon_url: string;
  reference: string;
  max_retry_attempts: number;
  forward_auth_token: boolean;
  responses_defaults?: Record<string, unknown>;
  created_at: number;
  updated_at: number;
}

export interface DialApplicationResource extends DialResource, EntityDefaults {
  application_type_schema_id?: string;
  input_attachment_types: string[];
  max_input_attachments?: number | string;
  responses_endpoint?: string;
  editor_url?: string;
  viewer_url?: string;
  application_properties: Record<string, unknown>;
  routes?: Record<string, unknown>;
  features?: DialApplicationResourceFeatures;
  external_services?: Record<string, DialExternalService>;
}

export interface DialExternalService {
  display_name?: string;
  description?: string;
  auth_settings?: DialExternalServiceAuthSettings;
}

export interface DialExternalServiceAuthSettings extends DialToolsetResourceAuthSettings {
  app_level_auth_status?: ToolsetAuthStatus;
}

export interface DialApplicationResourceFeatures {
  rate_endpoint: string;
  tokenize_endpoint: string;
  truncate_prompt_endpoint: string;
  configuration_endpoint: string;
  system_prompt_supported: boolean;
  tools_supported: boolean;
  seed_supported: boolean;
  url_attachments_supported: boolean;
  folder_attachments_supported: boolean;
  allow_resume: boolean;
  accessible_by_per_request_key: boolean;
  content_parts_supported: boolean;
  temperature_supported: boolean;
  consent_required: boolean;
  parallel_tool_calls_supported: boolean;
  assistant_attachments_in_request_supported: boolean;
  support_comment_in_rate_response: boolean;
  max_tokens_supported: boolean;
  max_completion_tokens_supported: boolean;
  custom_temperature_supported: boolean;
  reasoning_efforts?: string[];
}

export interface DialToolsetResource extends DialResource {
  name: string;
  description: string;
  defaults?: Record<string, unknown>;
  responses_defaults?: Record<string, unknown>;
  forward_per_request_key: boolean;
  auth_settings?: DialToolsetResourceAuthSettings;
  transport?: ToolsetTransport;
  allowed_tools: string[];
  provider?: string;
  updatedAt: string;
}

export interface DialToolsetResourceAuthSettings {
  authentication_type?: ToolsetAuthType;
  global_auth_status?: ToolsetAuthStatus;
  user_level_auth_status?: ToolsetAuthStatus;
  api_key_header?: string;
  client_id?: string;
  client_secret?: string;
  redirect_uri?: string;
  authorization_endpoint?: string;
  code_challenge?: string;
  code_verifier?: string;
  code_challenge_method?: ToolsetCodeChallengeMethod;
  token_endpoint?: string;
  token_endpoint_auth_method?: TokenEndpointAuthMethod;
  scopes_supported?: string[];
}

export enum TokenEndpointAuthMethod {
  CLIENT_SECRET_POST = 'client_secret_post',
  CLIENT_SECRET_BASIC = 'client_secret_basic',
  CLIENT_SECRET_NONE = 'client_secret_none',
}

export enum ToolsetCodeChallengeMethod {
  S256 = 'S256',
  PLAIN = 'PLAIN',
}

export enum ToolsetAuthCredentialLevel {
  GLOBAL = 'GLOBAL',
  USER = 'USER',
  APP = 'APP',
}

export enum ExternalServiceCredentialLevel {
  APPLICATION = 'APPLICATION',
  USER = 'USER',
}

export enum ToolsetAuthStatus {
  SIGNED_OUT = 'SIGNED_OUT',
  SIGNED_IN = 'SIGNED_IN',
  FAILED = 'FAILED',
}

export enum ToolsetAuthType {
  NONE = 'NONE',
  API_KEY = 'API_KEY',
  OAUTH = 'OAUTH',
}
