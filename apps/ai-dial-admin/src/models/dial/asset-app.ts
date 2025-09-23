import { BaseEntity } from './base-entity';
import { DialFile } from './file';

export interface DialAssetApp extends DialFile, BaseEntity {
  version: string;
  children?: DialAssetApp[];
  versions?: string[];
}
