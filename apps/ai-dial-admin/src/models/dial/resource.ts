import { JSONSchema7 } from 'json-schema';

import { DialApplicationScheme } from '@/src/models/dial/application';
import { CatalogEntityType } from '@/src/models/dial/catalog-schema';
import { LocalizedText } from '@/src/models/dial/localized';
import { BaseEntity, EntityAttachment, EntityDefaults, ModifiedEntity } from '@/src/models/dial/base-entity';
import { DeploymentInterfaceType, DialResourceInterface } from '@/src/models/dial/interfaces';
import { DialModelEndpoint, DialModelLimit, DialModelPricing } from '@/src/models/dial/model';
import { DialCoreRoleLimits, DialCoreRoleShare } from '@/src/models/dial/role-limits';
import { AttachmentPaths, DialAppRoute, RouteResponse } from '@/src/models/dial/route';
import { ToolsetTransport } from '@/src/types/toolset';

/**
 * The merge layer's `_metadata` graft object on a merged Core-resource detail entity (see the
 * `core-resource-entity-metadata` capability): every field the merge grafts that is not resource
 * content. Frontend-constructed and temporary — never sent to Core (every write path strips it
 * wholesale) and never persisted. `author`/`createdAt`/`updatedAt` are sourced metadata-response
 * first, falling back to the content response's own inline fields; `status`/`validationWarnings`
 * appear only where Core's content GET serves them (the `ConfigResourceController` projections on
 * invalid reads).
 */
export interface CoreResourceEntityMetadata {
  author?: string;
  /** Epoch milliseconds from the metadata node, stringified — the merge formatters' convention. */
  createdAt?: string;
  updatedAt?: string;
  name: string;
  path: string;
  folderId: string;
  /** Versioned types only (application-resource, toolset-resource) — from the `__version` URL suffix. */
  version?: string;
  nodeType?: string;
  status?: DialModelResourceStatus;
  validationWarnings?: CoreValidationWarning[];
}

export interface DialResource extends BaseEntity {
  display_name?: string;
  display_version?: string;
  description_keywords: string[];
  dependencies: string[];
  interceptors: string[];
  /**
   * Client-only create/duplicate identity: the folder the create modal runs in and the version it
   * seeds (`DEFAULT_NEW_ENTITY_VERSION`) or a duplicate flow overrides. A merged read never sets
   * these flat — its identity lives in `_metadata` — so write paths resolve them as
   * `app.folderId ?? app._metadata?.folderId` to serve both flows.
   */
  folderId?: string;
  version?: string;
  author?: string;
  endpoint?: string;
  icon_url: string;
  reference: string;
  max_retry_attempts: number;
  forward_auth_token: boolean;
  responses_defaults?: Record<string, unknown>;
  created_at: number;
  updated_at: number;
  etag?: string;
  _metadata?: CoreResourceEntityMetadata;
}

export interface DialApplicationResource
  extends Omit<DialResource, 'display_name' | 'description' | 'intro'>, EntityDefaults {
  display_name?: LocalizedText;
  description?: LocalizedText;
  intro?: LocalizedText;
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
  // Root url every `interfaces` entry with no `base_url` of its own falls back to (Deployment.baseUrl).
  base_url?: string;
  default_headers?: Record<string, string>;
  /**
   * `Application` is `@JsonNaming(SnakeCaseStrategy)` on Core — unlike `Model`/`Route`, whose
   * `RoleBasedEntity.userRoles` serializes as plain camelCase, Core always writes this back as
   * `user_roles`. `RoleBasedEntity`'s `@JsonAlias({"userRoles", "user_roles", "dial:userRoles"})`
   * only widens what a *write* accepts — it does not change what a *read* returns, so reading this
   * field as `userRoles` would silently never see a value back.
   */
  user_roles?: string[];
  /**
   * Snake_case, unlike `DialModelResource`/`DialInterceptorResource`, for the reason `user_roles`
   * documents: Core declares the pair on `Deployment` as `catalogSchemaId`/`catalogProperties` with
   * a `@JsonAlias` covering both spellings, but `Application`/`ToolSet` are
   * `@JsonNaming(SnakeCaseStrategy)`, so a read only ever returns the snake_case names. Declared on
   * the user-bucket shape so the platform-bucket one inherits it — Core carries it on both.
   */
  catalog_schema_id?: string;
  catalog_properties?: Record<string, unknown>;
}

export interface DialExternalService {
  display_name?: string;
  description?: string;
  auth_settings?: DialExternalServiceAuthSettings;
}

export interface DialExternalServiceAuthSettings extends DialToolsetResourceAuthSettings {
  app_level_auth_status?: ToolsetAuthStatus;
}

/**
 * The feature flags shared by every DIAL resource features shape (model, application). Resource-specific
 * extensions add their own fields on top — see `DialApplicationResourceFeatures` and
 * `DialModelResourceFeatures`.
 */
export interface DialResourceFeatures {
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
  parallel_tool_calls_supported: boolean;
  assistant_attachments_in_request_supported: boolean;
  support_comment_in_rate_response: boolean;
  max_tokens_supported: boolean;
  max_completion_tokens_supported: boolean;
  custom_temperature_supported: boolean;
  reasoning_efforts?: string[];
}

export interface DialApplicationResourceFeatures extends DialResourceFeatures {
  consent_required: boolean;
}

export interface DialModelResource extends EntityAttachment, EntityDefaults, ModifiedEntity {
  name: string;
  _metadata?: CoreResourceEntityMetadata;
  type?: DialModelResourceType;
  tokenizerModel?: string;
  overrideName?: string;
  limits?: DialModelLimit;
  pricing?: DialModelPricing;
  upstreams?: DialModelEndpoint[];
  embeddingDimensions?: number;
  displayName?: LocalizedText;
  displayVersion?: string;
  description?: LocalizedText;
  intro?: LocalizedText;
  reference?: string;
  iconUrl?: string;
  endpoint?: string;
  responsesEndpoint?: string;
  interfaces?: Record<string, DialResourceInterface>;
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
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
 * Accompanies an `invalid` status on read. DIAL Core serves a rejected entity through a separate
 * projection that names the offending field — the only channel explaining *why* the entity was left out
 * of the served configuration. Admin callers only; absent for a valid resource.
 */
export interface CoreValidationWarning {
  field?: string;
  message?: string;
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
  /**
   * Client-only create-flow identity — the resource name Core stores the schema under (the
   * percent-encoded `$id`). A merged read never sets it flat: its identity lives in `_metadata`,
   * with `$id` carrying the decoded form.
   */
  name?: string;
  _metadata?: CoreResourceEntityMetadata;
  ['dial:applicationTypeRoutes']?: DialAppRoute[];
}

/**
 * An interceptor resource (`interceptors/platform/{name}`) as returned by Core. Flat and unversioned
 * like `DialModelResource`, and — unlike an app runner's raw-JSON schema resource — a real
 * `Interceptor extends Deployment` entity that Core validates server-side, so this surface adds no
 * client-side meta-schema layer. Scoped to the fields the Properties/Configuration tabs use; fields
 * meaningful for a routing deployment but not for an interceptor (e.g. `maxRetryAttempts`,
 * `responsesEndpoint`) are left off.
 */
export interface DialInterceptorResource extends ModifiedEntity {
  name: string;
  _metadata?: CoreResourceEntityMetadata;
  displayName?: LocalizedText;
  description?: LocalizedText;
  iconUrl?: string;
  endpoint?: string | null;
  interfaces?: Record<string, DialResourceInterface>;
  overrideName?: string;
  forwardAuthToken?: boolean;
  descriptionKeywords?: string[];
  features?: DialResourceFeatures;
  defaults?: Record<string, unknown>;
  baseUrl?: string;
  catalogSchemaId?: string;
  catalogProperties?: Record<string, unknown>;
}

/**
 * A route resource (`routes/platform/{name}`) as returned by Core. Flat and unversioned like
 * `DialModelResource`/`DialInterceptorResource`, and — unlike an interceptor — `Route extends
 * RoleBasedEntity` directly rather than `Deployment`, so it has no `displayName`/`description`/
 * `iconUrl`/`endpoint`/`features`. `userRoles` (`RoleBasedEntity`'s own field — membership only, no
 * per-role limits) is the one field this surface does expose from that base class, via its Roles
 * tab (`AssetRoles`); full role-limit editing remains out of scope, same as every other Core-direct
 * asset surface.
 */
export interface DialRouteResource extends ModifiedEntity {
  name: string;
  _metadata?: CoreResourceEntityMetadata;
  userRoles?: string[];
  paths?: string[];
  methods?: string[];
  rewritePath?: boolean;
  response?: RouteResponse;
  upstreams?: DialModelEndpoint[];
  maxRetryAttempts?: number;
  order?: number;
  attachmentPaths?: AttachmentPaths;
}

/**
 * A catalog schema resource (`catalog_schemas/platform/{encodeURIComponent($id)}`) as returned by
 * Core. The body is stored verbatim and only the `$id` is validated — unique at create, immutable
 * afterwards — so `validateCatalogSchema` enforces every other meta-schema constraint.
 *
 * `properties`/`required` are the schema's own JSON-Schema keywords; a property's `dial:file` and
 * `dial:meta` hints stay inside the body rather than becoming typed fields here.
 */
export interface DialCatalogSchemaResource extends ModifiedEntity {
  $id?: string;
  ['dial:catalogEntityType']?: CatalogEntityType;
  ['dial:catalogDisplayName']?: string;
  ['dial:defaultLocale']?: string;
  properties?: JSONSchema7['properties'];
  required?: string[];
  /**
   * Client-only create-flow identity — the percent-encoded `$id` Core stores the schema under. A
   * merged read never sets it flat: its identity lives in `_metadata`, with `$id` carrying the
   * decoded form.
   */
  name?: string;
  _metadata?: CoreResourceEntityMetadata;
}

/**
 * A translator resource (`translators/platform/{name}`) as returned by Core. Flat and unversioned
 * like `DialModelResource`/`DialInterceptorResource`/`DialRouteResource`, and — unlike any of
 * those — a plain POJO on Core (`Translator` extends neither `Deployment` nor `RoleBasedEntity`), so
 * it has no `displayName`/`description`/`endpoint`/`features`/`userRoles`. `in`/`out` reuse the same
 * `DeploymentInterfaceType` enum `interfaces` fields elsewhere already key by — Core's `InterfaceType`
 * and this enum carry the same four values.
 */
export interface DialTranslatorResource extends ModifiedEntity {
  /**
   * Client-only create-flow identity — Core's `Translator` declares no `name` field, so this only
   * ever holds what the create form seeds; a merged read's identity lives in `_metadata`.
   */
  name?: string;
  _metadata?: CoreResourceEntityMetadata;
  in?: DeploymentInterfaceType;
  out?: DeploymentInterfaceType;
  baseUrl?: string;
}

/**
 * A role resource (`roles/platform/{name}`) as returned by Core. Flat and unversioned like
 * `DialModelResource`/`DialInterceptorResource`/`DialRouteResource`. `Role` is a plain class — it
 * extends neither `RoleBasedEntity` (no `userRoles`) nor `Deployment` (no `displayName`/
 * `description`) — so this model carries only `limits`/`costLimit`/`share`. `grantedKeys` is
 * deliberately absent: it has no field on Core's `Role` class at all, since the real relationship is
 * inverted (`Key.roles`/`Key.role`) — granting/revoking a key is out of scope here, deferred until
 * Keys itself has an asset surface to write through.
 *
 * `limits`/`costLimit` values stay plain numbers (`DialCoreRoleLimits`) — `mergeRoleResource` drops
 * any token too large for `Number.isSafeInteger` rather than converting it to a string; see that
 * function's doc comment for why. `share` keeps Core's own snake_case `ShareResourceLimit` shape
 * (`DialCoreRoleShare`), distinct from the admin-backend's camelCase `DialRoleShare`.
 */
export interface DialRoleResource extends ModifiedEntity {
  name: string;
  _metadata?: CoreResourceEntityMetadata;
  limits?: Record<string, DialCoreRoleLimits>;
  costLimit?: DialCoreRoleLimits;
  share?: Record<string, DialCoreRoleShare>;
}

/**
 * Core-direct representation of a `Key` resource (`ResourceTypes.PROJECT_KEY`). Stored in the flat
 * `platform` bucket. The `key` field is write-only in Core (`@JsonProperty(WRITE_ONLY)`) and is
 * never present on reads — it is only passed on create and rotation writes.
 *
 * The `roles` field lists the role names this key GRANTS to its bearer, which is the inverse of
 * the `userRoles` pattern on other entity types.
 */
export interface DialKeyResource extends ModifiedEntity {
  /**
   * Client-only create-flow identity — Core's `Key` declares no `name` field, so this only ever
   * holds what the create form seeds (the resource path is built from it); a merged read's
   * identity lives in `_metadata`. Stripped from every write payload alongside `_metadata`.
   */
  name?: string;
  _metadata?: CoreResourceEntityMetadata;
  key?: string;
  project?: string;
  secured?: boolean;
  roles?: string[];
  allowedIpAddressRanges?: string[];
}

/**
 * A platform-bucket application resource (`applications/platform/{name}`), as returned by Core.
 * Core reuses the same `Application` entity class for both the `public` and `platform` buckets — the
 * bucket segment alone distinguishes them — so this carries the same snake_case content fields as
 * `DialApplicationResource`, minus `created_at`/`updated_at` (in favor of `ModifiedEntity`'s
 * `createdAt`/`updatedAt`) and `etag` — the fields the flat `platform` bucket's
 * `ConfigResourceController` reads never serve inline. Flat and unversioned like `DialKeyResource`.
 */
export interface DialPlatformApplicationResource
  extends Omit<DialApplicationResource, 'created_at' | 'updated_at' | 'etag'>, ModifiedEntity {
  name: string;
  _metadata?: CoreResourceEntityMetadata;
}

/**
 * A platform-bucket toolset resource (`toolsets/platform/{name}`), as returned by Core. Core reuses
 * the same `ToolSet` entity class for both the `public` and `platform` buckets — the bucket segment
 * alone distinguishes them — so this carries the same snake_case content fields as
 * `DialToolsetResource`, minus `created_at`/`updated_at` (in favor of `ModifiedEntity`'s
 * `createdAt`/`updatedAt`) and `etag` — the fields the flat `platform` bucket's
 * `ConfigResourceController` reads never serve inline. Flat and unversioned like
 * `DialPlatformApplicationResource`.
 */
export interface DialPlatformToolsetResource
  extends Omit<DialToolsetResource, 'created_at' | 'updated_at' | 'etag'>, ModifiedEntity {
  name: string;
  _metadata?: CoreResourceEntityMetadata;
}

/** The resource types DIAL Core keeps in its flat `platform` bucket — see `isFlatPlatformView`. */
export type PlatformAsset =
  | DialModelResource
  | DialAppRunnerResource
  | DialCatalogSchemaResource
  | DialInterceptorResource
  | DialTranslatorResource
  | DialRouteResource
  | DialRoleResource
  | DialKeyResource
  | DialPlatformApplicationResource
  | DialPlatformToolsetResource;

export enum DialModelResourceType {
  Chat = 'CHAT',
  Completion = 'COMPLETION',
  Embedding = 'EMBEDDING',
}

export interface DialModelResourceFeatures extends DialResourceFeatures {
  cache_supported: boolean;
  auto_caching_supported: boolean;
}

export interface DialToolsetResource extends Omit<DialResource, 'display_name' | 'description' | 'intro'> {
  name: string;
  display_name?: LocalizedText;
  description: LocalizedText;
  intro?: LocalizedText;
  defaults?: Record<string, unknown>;
  responses_defaults?: Record<string, unknown>;
  forward_per_request_key: boolean;
  auth_settings?: DialToolsetResourceAuthSettings;
  transport?: ToolsetTransport;
  allowed_tools: string[];
  provider?: string;
  vendor_website?: string;
  /** See `DialApplicationResource.user_roles` — `ToolSet` is also `@JsonNaming(SnakeCaseStrategy)`. */
  user_roles?: string[];
  catalog_schema_id?: string;
  catalog_properties?: Record<string, unknown>;
}

/**
 * A skill resource's folder metadata. `name`/`folderId` are derived from `path` alone (Core exposes
 * no separate display name — see `SkillsCoreApi.getSkillMetadata`'s doc comment); `description`/
 * `version` live only in `SKILL.md`'s frontmatter and are deliberately left unpopulated here — the
 * Skill tab (see `SkillManifestTab`) fetches and parses `SKILL.md`'s content independently
 * (`getSkillManifestContent`/`parseSkillManifest`) rather than populating them on this model, since
 * every other consumer of `DialSkillResource` (the list, the folder tree) never needs the manifest's
 * content and shouldn't pay for fetching it. `files` lists the bundle's contents, read separately via
 * `SkillsCoreApi.getSkillFiles` (Core's metadata endpoint reports no per-file size).
 */
export interface DialSkillResource {
  name: string;
  description?: string;
  version?: string;
  path: string;
  /** The containing folder's path, e.g. `public/` for a skill at `public/my-skill` — enables Move. */
  folderId: string;
  etag?: string;
  files: DialSkillFile[];
  /**
   * Author/created/updated from the skill's own row in its parent folder's listing (see
   * `SkillsCoreApi.getSkillMetadata`) — the skill read's only grafted fields, so its `_metadata`
   * is the timestamp/author subset of the shared shape. `name`/`folderId` stay flat: they are
   * derived from the requested path itself, not grafted from a second response, and the Skills
   * tree rows share this model's flat identity. Present when read via the Assets surface — Skill
   * Publications' properties view doesn't show these.
   */
  _metadata?: Pick<CoreResourceEntityMetadata, 'author' | 'createdAt' | 'updatedAt'>;
}

export interface DialSkillFile {
  name: string;
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
  DIAL_NATIVE = 'DIAL_NATIVE',
}
