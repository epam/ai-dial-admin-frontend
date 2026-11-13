import { AssetListItem } from '@/src/models/dial/asset-list-item';

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
