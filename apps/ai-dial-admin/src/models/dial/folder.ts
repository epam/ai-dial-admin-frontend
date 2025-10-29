import { DialFile } from './file';
import { DialRule } from './rule';

export interface DialFolder extends DialFile {
  items?: DialFolder[];
  rules?: Record<string, DialRule[]>;
}
