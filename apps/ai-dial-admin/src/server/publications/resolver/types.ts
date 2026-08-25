import { Token } from '@/src/models/auth';
import { DialFile } from '@/src/models/dial/file';
import { DialSkillResource } from '@/src/models/dial/resource';
import { ServerActionResponse } from '@/src/models/server-action';
import { ResourceType } from '@/src/types/resource-type';

/** The `Publication` field that holds a type's primary resource list. */
export type PublicationResourceKey =
  | 'prompts'
  | 'applicationResources'
  | 'conversations'
  | 'toolSetResources'
  | 'files'
  | 'skillResources';

/** The field on a resource wrapper that holds the enriched asset body. */
export type PublicationAssetKey =
  | 'prompt'
  | 'applicationResource'
  | 'conversation'
  | 'toolSetResource'
  | 'file'
  | 'skillResource';

/**
 * Resource types the publications workflow can carry. The `ConfigResourceController`-backed types
 * (models, app runners, interceptors, roles) have no publications support — Core has no sharing or
 * publication concept for them. Interceptors and roles are read-only reference data here, registered
 * only so their metadata listing can be read.
 */
export type PublishableResourceType = Exclude<
  ResourceType,
  ResourceType.MODEL | ResourceType.APP_TYPE_SCHEMA | ResourceType.INTERCEPTOR | ResourceType.ROLE | ResourceType.ROUTE
>;

export interface PublicationTypeConfig {
  resourceType: PublishableResourceType;
  prefix: string;
  resourceKey: PublicationResourceKey;
  assetKey: PublicationAssetKey;
  /** Whether the publication also carries attached file resources (application/conversation/toolset). */
  hasFiles: boolean;
  /** Issue message when the primary resource cannot be found. */
  notFoundMessage: string;
  /** Issue message when the resource already exists at its target. */
  alreadyExistsMessage: string;
}

/**
 * The upstream calls publication resolution needs. Injected so the resolver stays
 * pure/testable and to avoid a circular import with `app/api/api`.
 */
export interface EnrichmentClients {
  getAsset: (token: Token, path: string, type: ResourceType, etag: string) => Promise<ServerActionResponse>;
  updateAsset: (token: Token, asset: object, type: ResourceType, etag: string) => Promise<ServerActionResponse>;
  getBucket: (token: Token) => Promise<{ bucket: string } | null>;
  getFileMetadata: (token: Token, path: string) => Promise<DialFile | null>;
  uploadFile: (token: Token, path: string, file: File) => Promise<ServerActionResponse>;
  /** Folder-metadata-only lookup for a skill (`GET /v2/metadata/skills/{bucket}/{path}/`) — no ZIP/content fetch. */
  getSkillMetadata: (token: Token, path: string) => Promise<DialSkillResource | null>;
}
