import { DialApplication } from './application';
import { DialFile } from './file';

export interface DialAssetApp extends DialFile, DialApplication {
  version: string;
  children?: DialAssetApp[];
  versions?: string[];
}
