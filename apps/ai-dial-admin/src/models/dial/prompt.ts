import { DialBaseEntity } from './base-entity';
import { DialFile } from './file';

export interface DialPrompt extends DialBaseEntity, DialFile {
  version: string;
  status: PromptStatus;
  content: string;
  id?: string;
  children?: DialPrompt[];
  versions?: string[];
}

export enum PromptStatus {
  pending = 'PENDING',
  approved = 'APPROVED',
}
