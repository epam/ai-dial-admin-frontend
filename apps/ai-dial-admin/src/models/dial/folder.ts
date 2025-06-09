import { DialFile } from './file';
import { DialRule } from './rule';

export interface DialFolder extends DialFile {
  children?: DialFolder[];
  rules?: Record<string, DialRule[]>;
}
