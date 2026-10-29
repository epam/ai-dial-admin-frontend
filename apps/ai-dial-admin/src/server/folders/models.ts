import { Token } from '@/src/models/auth';
import { ServerActionResponse } from '@/src/models/server-action';
import { CoreResourceMetadataNode, ResourceInfo } from '@/src/server/core/asset-metadata';

/**
 * The per-group operations the recursive complex-resource folder walk and delete need. Each group (Skills,
 * Projects) binds them to its own Core client and list mapper.
 */
export interface ComplexFolderOps {
  listMetadata: (
    token: Token,
    path: string,
    options: { nextToken?: string },
  ) => Promise<CoreResourceMetadataNode | null>;
  toList: (node: CoreResourceMetadataNode | null) => ResourceInfo[];
  deleteResource: (token: Token, path: string, etag: string) => Promise<ServerActionResponse>;
  deleteFolder: (token: Token, path: string, etag: string) => Promise<ServerActionResponse>;
}
