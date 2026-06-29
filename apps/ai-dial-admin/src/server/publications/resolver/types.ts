import { Token } from '@/src/models/auth';
import { DialFile } from '@/src/models/dial/file';
import { ServerActionResponse } from '@/src/models/server-action';
import { ResourceType } from '@/src/types/resource-type';

/** The `Publication` field that holds a type's primary resource list. */
export type PublicationResourceKey =
  | 'prompts'
  | 'applicationResources'
  | 'conversations'
  | 'toolSetResources'
  | 'files';

/** The field on a resource wrapper that holds the enriched asset body. */
export type PublicationAssetKey = 'prompt' | 'applicationResource' | 'conversation' | 'toolSetResource' | 'file';

export interface PublicationTypeConfig {
  resourceType: ResourceType;
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
 *
 * Phase 1: asset get/put go to the admin BE (`assetsApi`); bucket/file go to Core.
 */
export interface EnrichmentClients {
  getAsset: (token: Token, path: string, type: ResourceType, etag: string) => Promise<ServerActionResponse>;
  updateAsset: (token: Token, asset: object, type: ResourceType, etag: string) => Promise<ServerActionResponse>;
  getBucket: (token: Token) => Promise<{ bucket: string } | null>;
  getFileMetadata: (token: Token, path: string) => Promise<DialFile | null>;
  uploadFile: (token: Token, path: string, file: File) => Promise<ServerActionResponse>;
}
