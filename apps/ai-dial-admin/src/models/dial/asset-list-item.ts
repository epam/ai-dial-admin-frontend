import { DialFileNodeType } from '@/src/models/dial/file';

/**
 * The bucket a Core resource lives in, as Core's own metadata node reports it. Mapped onto every
 * listing row by the shared row mapper (see `asset-metadata.ts`) so row consumers answer "which
 * bucket" from this field instead of parsing a `folderId`/`path` prefix. `platform` is Core's fixed
 * `ConfigResourceController` bucket (see `root-folder.ts`); every hierarchical asset tree browsed by
 * this app lives in `public`.
 */
export enum BucketType {
  Public = 'public',
  Platform = 'platform',
}

/** The source that supplied a FileManager row; unlike `BucketType`, file is not a Core storage bucket. */
export enum EntitySource {
  Resource = 'resource',
  File = 'file',
}

/**
 * The client-side counterpart of the server's `ResourceInfo` (`asset-metadata.ts`) — every asset
 * folder tree row (prompts, conversations, files, skills, apps/toolsets in both buckets, the eight
 * flat platform views) is shaped like this, sourced from the same shared mapper. Never constructed
 * directly: rows come as one of the three flavors below, which add or omit `folderId` at the type
 * level rather than leaving it present-but-unreliable on a single flat shape.
 */
export interface AssetListItem {
  name: string;
  path: string;
  nodeType?: DialFileNodeType;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  etag?: string;
  bucket: BucketType;
  entitySource?: EntitySource;
}

/**
 * A row belonging to a movable, folder-nested asset (prompts, files, skills, and the public-bucket
 * rows of apps/toolsets). `folderId` is required — every such row is browsed from, and can be moved
 * between, folders — and `version` is present only for the two versioned types (apps/toolsets).
 */
export interface MovableAssetListItem extends AssetListItem {
  folderId: string;
  version?: string;
}

/**
 * A row belonging to a folder-nested asset that is never moved (conversations). Keeps `folderId`
 * required, like `MovableAssetListItem`, so folder browsing works identically — the two flavors
 * differ only in whether the UI offers a move action, gated by which flavor the context declares.
 */
export interface TreeAssetListItem extends AssetListItem {
  folderId: string;
}

/**
 * A row belonging to a flat platform-bucket listing (the eight flat platform views, plus the
 * platform-bucket rows of apps/toolsets). Declares no `folderId` — reading one off a platform row is
 * a compile-time error, not a runtime check, matching that these rows have no folder concept at all.
 */
export type PlatformAssetListItem = AssetListItem;
