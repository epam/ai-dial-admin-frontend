import { BaseEntity } from './base-entity';
import { DialFile } from './file';
import { CoreResourceEntityMetadata } from './resource';

export interface DialPrompt extends DialFile, BaseEntity {
  content?: string;
  id?: string;
  items?: DialPrompt[];
  /**
   * Present when this holds a merged Core detail entity — its grafted identity/audit fields live
   * here, with the flat `path`/`folderId`/`author` this row/tree shape keeps declared left unset
   * (see `CoreResourceEntityMetadata`). Folder-tree and grid rows never set it.
   */
  _metadata?: CoreResourceEntityMetadata;
}
