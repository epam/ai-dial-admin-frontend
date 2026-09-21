import { BaseEntity } from './base-entity';
import { DialFile } from './file';

export interface DialPrompt extends DialFile, BaseEntity {
  content?: string;
  id?: string;
  items?: DialPrompt[];
}
