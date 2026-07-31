import { DialApplicationScheme } from '@/src/models/dial/application';
import { BaseEntity, EntityAttachment, EntityDefaults, ModifiedEntity } from '@/src/models/dial/base-entity';
import { DialResourceInterface } from '@/src/models/dial/interfaces';
import { DialModelEndpoint, DialModelLimit, DialModelPricing } from '@/src/models/dial/model';
import { DialAppRoute } from '@/src/models/dial/route';
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
  interfaces?: Record<string, DialResourceInterface>;
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

export interface DialModelResource extends EntityAttachment, EntityDefaults, ModifiedEntity {
  name: string;
  path: string;
  folderId: string;
  status?: DialModelResourceStatus;
  type?: DialModelResourceType;
  tokenizerModel?: string;
  overrideName?: string;
  limits?: DialModelLimit;
  pricing?: DialModelPricing;
  upstreams?: DialModelEndpoint[];
  fieldsHashingOrder?: string[];
  embeddingDimensions?: number;
  displayName?: string;
  displayVersion?: string;
  description?: string;
  intro?: string;
  reference?: string;
  iconUrl?: string;
  endpoint?: string;
  responsesEndpoint?: string;
  interfaces?: Record<string, DialResourceInterface>;
  forwardAuthToken?: boolean;
  maxRetryAttempts?: number;
  interceptors?: string[];
  features?: DialModelResourceFeatures;
  descriptionKeywords?: string[];
  dependencies?: string[];
  author?: string;
  userRoles?: string[];
  catalogSchemaId?: string;
  catalogProperties?: Record<string, unknown>;
}

export enum DialModelResourceStatus {
  Valid = 'valid',
  Invalid = 'invalid',
}

/**
 * App-runner (`schemas/platform/{name}`) as returned by Core, in the same `dial:`-prefixed shape the
 * admin-BE-backed `DialApplicationScheme` uses — so the runner editors are shared between the two
 * surfaces. `applications` is excluded because that association exists only in the admin BE's
 * database, and routes are narrowed to `DialAppRoute` since this surface edits attachment paths and
 * permissions.
 */
export interface DialAppRunnerResource extends Omit<
  DialApplicationScheme,
  'applications' | 'dial:applicationTypeRoutes'
> {
  name: string;
  path: string;
  folderId: string;
  author?: string;
  status?: DialModelResourceStatus;
  ['dial:applicationTypeRoutes']?: DialAppRoute[];
}

export enum DialModelResourceType {
  Chat = 'CHAT',
  Completion = 'COMPLETION',
  Embedding = 'EMBEDDING',
}

export interface DialModelResourceFeatures {
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
  cache_supported: boolean;
  auto_caching_supported: boolean;
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
  vendor_website?: string;
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
