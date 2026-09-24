import { ModifiedEntity } from '@/src/models/dial/base-entity';
import { CoreResourceEntityMetadata } from './resource';

export interface DialFile extends ModifiedEntity {
  bucket?: string;
  entitySource?: string;
  contentLength?: number;
  contentType?: string;
  nodeType?: DialFileNodeType;
  parentPath?: string | null;
  url?: string;
  items?: DialFile[];
  path: string;
  name?: string;
  /**
   * Required on every list row (`MovableAssetListItem`'s contract) but genuinely absent on a
   * freshly-read detail DTO before a folder is resolved for it — narrowed from blanket-required so
   * `DialFile` still serves both roles; row construction always supplies it (see `file-metadata.ts`).
   */
  folderId?: string;
  author?: string;
  nextToken?: string;
  extension?: string;
  id?: string;
  permissions?: string[];
  /** Core resource etag, required to delete a file (see `migrate-files-to-core`'s etag bugfix). */
  etag?: string;
  _metadata?: CoreResourceEntityMetadata;
}

export enum DialFileNodeType {
  ITEM = 'item',
  FOLDER = 'folder',
}

export interface CustomFile {
  path: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
}
