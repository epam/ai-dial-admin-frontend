import { DialBaseNamedEntity } from './base-entity';
import { DialFile } from './file';

export interface DialPrompt extends DialBaseNamedEntity, DialFile {
  version: string;
  status: PromptStatus;
  content: string;
  id?: string;
  children?: DialPrompt[];
  versions?: string[];
}

enum PromptStatus {
  pending = 'PENDING',
  approved = 'APPROVED',
}
