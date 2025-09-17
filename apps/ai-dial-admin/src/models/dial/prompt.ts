import { BaseEntity } from './base-entity';
import { DialFile } from './file';

export interface DialPrompt extends DialFile, BaseEntity {
  version: string;
  content: string;
  id?: string;
  children?: DialPrompt[];
  versions?: string[];
}
