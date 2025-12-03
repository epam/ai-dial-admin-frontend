import { AssetApp } from './dial/deployment-asset';
import { DialPrompt } from './dial/prompt';

export type ImportData = File | File[] | ParsedAssets;

export interface ParsedAssets {
  prompts?: DialPrompt[];
  applications?: AssetApp[];
}

export interface AssetImportGridData {
  name: string;
  version: string;
  assetName: string;
  existingNames?: string[];
  index: number;
  invalid?: boolean;
  extension?: string;
}
