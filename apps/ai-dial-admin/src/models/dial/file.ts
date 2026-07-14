import { ModifiedEntity } from '@/src/models/dial/base-entity';

export interface DialFile extends ModifiedEntity {
  bucket?: string;
  contentLength?: number;
  contentType?: string;
  nodeType?: DialFileNodeType;
  parentPath?: string | null;
  resourceType?: DialFileResourceType;
  url?: string;
  items?: DialFile[];
  path: string;
  name?: string;
  folderId: string;
  author?: string;
  nextToken?: string;
  extension?: string;
  id?: string;
  permissions?: string[];
  /** Core resource etag, required to delete a file (see `migrate-files-to-core`'s etag bugfix). */
  etag?: string;
}

export enum DialFileNodeType {
  ITEM = 'item',
  FOLDER = 'folder',
}

export enum DialFileResourceType {
  FILE = 'FILE',
}

export interface CustomFile {
  path: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
}
