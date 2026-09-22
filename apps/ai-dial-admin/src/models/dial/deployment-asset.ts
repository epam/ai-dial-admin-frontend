import { DialApplication } from './application';
import { EntityValidityState } from './base-entity';
import { DialFile } from './file';
import { CoreResourceEntityMetadata, DialModelResource } from './resource';
import { Toolset } from './toolset';

export interface AssetApp extends DialFile, DialApplication, EntityValidityState {
  version: string;
  items?: AssetApp[];
  versions?: string[];
  reference?: string;
  display_name?: string;
  displayVersion?: string;
  selectedVersions?: string[];
  /**
   * Present when this holds a merged Core detail entity: the detail views keep this row-shaped
   * surface because their create/new-version flows seed the flat identity fields, while a merged
   * read carries its identity only here (see `CoreResourceEntityMetadata`). Grid/tree rows never
   * set it.
   */
  _metadata?: CoreResourceEntityMetadata;
}

export interface AssetToolset extends DialFile, Toolset {
  version: string;
  items?: AssetToolset[];
  versions?: string[];
  display_name?: string;
  displayVersion?: string;
  selectedVersions?: string[];
  /** See `AssetApp._metadata`. */
  _metadata?: CoreResourceEntityMetadata;
}

export interface AssetModel extends DialFile, Omit<DialModelResource, 'name'>, EntityValidityState {
  items?: AssetModel[];
}

export type DeploymentAsset = AssetApp | AssetToolset;
export type AssetWithVersion = DeploymentAsset;
export type Asset = AssetWithVersion | DialFile;
