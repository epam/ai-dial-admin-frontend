import { DialApplication } from './application';
import { DialFile } from './file';
import { DialPrompt } from './prompt';
import { Toolset } from './toolset';

export interface AssetApp extends DialFile, DialApplication {
  version: string;
  children?: AssetApp[];
  versions?: string[];
  applicationTypeSchemaId?: string;
}

export interface AssetToolset extends DialFile, Toolset {
  version: string;
  children?: AssetToolset[];
  versions?: string[];
}

export type DeploymentAsset = AssetApp | AssetToolset;
export type Asset = DeploymentAsset | DialPrompt;
