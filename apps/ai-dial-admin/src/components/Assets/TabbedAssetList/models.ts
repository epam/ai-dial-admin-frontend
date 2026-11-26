import { AssetListItem } from '@/src/models/dial/asset-list-item';
import { AssetSource } from '@/src/models/dial/asset-source';

export interface ListingSelection {
  source: AssetSource;
  rows: AssetListItem[];
}
