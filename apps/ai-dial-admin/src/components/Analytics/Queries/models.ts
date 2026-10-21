import { SavedQueryScope } from '@/src/models/analytics/saved-query';

export interface QueryMetadataForm {
  name: string;
  description: string;
  tag: string;
  scope: SavedQueryScope;
}
