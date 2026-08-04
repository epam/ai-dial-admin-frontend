import { ResourceType } from '@/src/types/resource-type';
import { RESOURCE_TYPE_PREFIX } from '@/src/constants/publications-core';

/** Resource types with a `__version`-suffixed name and a metadata+content split. Files, models, app runners, interceptors and roles are versionless. */
export type VersionedResourceType = Exclude<
  ResourceType,
  ResourceType.FILE | ResourceType.MODEL | ResourceType.APP_TYPE_SCHEMA | ResourceType.INTERCEPTOR | ResourceType.ROLE
>;

export const VERSIONED_RESOURCE_TYPES: VersionedResourceType[] = [
  ResourceType.APPLICATION,
  ResourceType.TOOLSET,
  ResourceType.CONVERSATION,
  ResourceType.PROMPT,
];

/** `v1/{prefix}` content endpoint per resource type (mirrors the backend's per-type Core clients). */
export const CORE_RESOURCE_URL: Record<ResourceType, string> = {
  [ResourceType.APPLICATION]: `v1/${RESOURCE_TYPE_PREFIX[ResourceType.APPLICATION]}`,
  [ResourceType.TOOLSET]: `v1/${RESOURCE_TYPE_PREFIX[ResourceType.TOOLSET]}`,
  [ResourceType.CONVERSATION]: `v1/${RESOURCE_TYPE_PREFIX[ResourceType.CONVERSATION]}`,
  [ResourceType.PROMPT]: `v1/${RESOURCE_TYPE_PREFIX[ResourceType.PROMPT]}`,
  [ResourceType.FILE]: `v1/${RESOURCE_TYPE_PREFIX[ResourceType.FILE]}`,
  [ResourceType.MODEL]: `v1/${RESOURCE_TYPE_PREFIX[ResourceType.MODEL]}`,
  [ResourceType.APP_TYPE_SCHEMA]: `v1/${RESOURCE_TYPE_PREFIX[ResourceType.APP_TYPE_SCHEMA]}`,
  [ResourceType.INTERCEPTOR]: `v1/${RESOURCE_TYPE_PREFIX[ResourceType.INTERCEPTOR]}`,
  [ResourceType.ROLE]: `v1/${RESOURCE_TYPE_PREFIX[ResourceType.ROLE]}`,
};

/** `v1/metadata/{prefix}` metadata endpoint per resource type. */
export const CORE_RESOURCE_METADATA_URL: Record<ResourceType, string> = {
  [ResourceType.APPLICATION]: `v1/metadata/${RESOURCE_TYPE_PREFIX[ResourceType.APPLICATION]}`,
  [ResourceType.TOOLSET]: `v1/metadata/${RESOURCE_TYPE_PREFIX[ResourceType.TOOLSET]}`,
  [ResourceType.CONVERSATION]: `v1/metadata/${RESOURCE_TYPE_PREFIX[ResourceType.CONVERSATION]}`,
  [ResourceType.PROMPT]: `v1/metadata/${RESOURCE_TYPE_PREFIX[ResourceType.PROMPT]}`,
  [ResourceType.FILE]: `v1/metadata/${RESOURCE_TYPE_PREFIX[ResourceType.FILE]}`,
  [ResourceType.MODEL]: `v1/metadata/${RESOURCE_TYPE_PREFIX[ResourceType.MODEL]}`,
  [ResourceType.APP_TYPE_SCHEMA]: `v1/metadata/${RESOURCE_TYPE_PREFIX[ResourceType.APP_TYPE_SCHEMA]}`,
  [ResourceType.INTERCEPTOR]: `v1/metadata/${RESOURCE_TYPE_PREFIX[ResourceType.INTERCEPTOR]}`,
  [ResourceType.ROLE]: `v1/metadata/${RESOURCE_TYPE_PREFIX[ResourceType.ROLE]}`,
};

/** Backend default list path — only Conversation and Prompt default an omitted path (`ConversationService`/`PromptService`). */
export const DEFAULT_LIST_PATH = 'public/';

/** Resource types whose list read defaults path/limit when the caller omits them. */
export const DEFAULT_LIST_PATH_TYPES: ReadonlySet<ResourceType> = new Set([
  ResourceType.CONVERSATION,
  ResourceType.PROMPT,
]);

/**
 * Resource types served by Core's `ConfigResourceController`: flat, unversioned, and stored under
 * the single fixed `platform` bucket that their `RESOURCE_TYPE_PREFIX` already includes.
 */
export const PLATFORM_BUCKET_RESOURCE_TYPES: ReadonlySet<ResourceType> = new Set([
  ResourceType.MODEL,
  ResourceType.APP_TYPE_SCHEMA,
  ResourceType.INTERCEPTOR,
  ResourceType.ROLE,
]);

/** Backend default metadata page size for Conversation/Prompt list reads when the caller omits a limit. */
export const DEFAULT_LIST_LIMIT = 100;

/** Generic Core move op, shared across every resource type (`ResourceClient.move` on the BE). */
export const CORE_RESOURCE_MOVE_URL = 'v1/ops/resource/move';
