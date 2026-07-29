import { DialApplication } from './application';
import { EntityValidityState } from './base-entity';
import { DialFile } from './file';
import { DialPrompt } from './prompt';
import { DialModelResource } from './resource';
import { Toolset } from './toolset';

export interface AssetApp extends DialFile, DialApplication, EntityValidityState {
  version: string;
  items?: AssetApp[];
  versions?: string[];
  reference?: string;
  display_name?: string;
  displayVersion?: string;
  selectedVersions?: string[];
}

export interface AssetToolset extends DialFile, Toolset {
  version: string;
  items?: AssetToolset[];
  versions?: string[];
  display_name?: string;
  displayVersion?: string;
  selectedVersions?: string[];
}

export interface AssetModel extends DialFile, Omit<DialModelResource, 'name'>, EntityValidityState {
  items?: AssetModel[];
}

export type DeploymentAsset = AssetApp | AssetToolset;
export type AssetWithVersion = DeploymentAsset | DialPrompt;
export type Asset = AssetWithVersion | DialFile;
