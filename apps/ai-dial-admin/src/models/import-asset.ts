import { AssetApp, AssetToolset } from './dial/deployment-asset';
import { DialPrompt } from './dial/prompt';

export type ImportData = File | File[] | ParsedAssets;

export interface ParsedAssets {
  prompts?: DialPrompt[];
  applications?: AssetApp[];
  toolSets?: AssetToolset[];
}

export interface AssetImportGridData {
  name: string;
  /** Versioned imports only (apps/toolsets) — a versionless prompt row carries no version. */
  version?: string;
  assetName: string;
  existingNames?: string[];
  index: number;
  invalid?: boolean;
  extension?: string;
}
