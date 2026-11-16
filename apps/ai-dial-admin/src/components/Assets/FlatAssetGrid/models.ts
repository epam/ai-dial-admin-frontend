import { AssetListItem } from '@/src/models/dial/asset-list-item';
import { AssetSource } from '@/src/models/dial/asset-source';

/** The sources a flat grid can show; Public only for a view whose Public source is flat. */
export type FlatAssetSource = AssetSource.Public | AssetSource.Platform | AssetSource.ConfigFile;

export type FlatReadResult =
  | { success: true; rows: AssetListItem[] }
  | { success: false; errorHeader?: string; errorMessage?: string };

export interface FlatAssets {
  rows: AssetListItem[];
  /** `undefined` until the first read lands and after a failed one, so a badge never shows a false zero. */
  count: number | undefined;
  isLoading: boolean;
  hasError: boolean;
  refetch: () => Promise<void>;
}
