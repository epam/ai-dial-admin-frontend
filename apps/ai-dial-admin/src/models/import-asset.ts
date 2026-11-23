import { AssetApp, AssetToolset } from './dial/deployment-asset';
import { DialPrompt } from './dial/prompt';
import { DialToolsetResourceAuthSettings } from './dial/resource';

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
  /** Toolset import only: the file is an OAUTH toolset, so its row carries an editable client secret. */
  isOAuth?: boolean;
  clientSecret?: string;
}

/** The part of an exported toolset file the client-secret handling reads — the file is snake_case. */
export interface ToolsetImportFile {
  auth_settings?: DialToolsetResourceAuthSettings;
}

export interface ClientSecretColumnOptions {
  headerName: string;
  getInputLabel: (rowName: string) => string;
}
