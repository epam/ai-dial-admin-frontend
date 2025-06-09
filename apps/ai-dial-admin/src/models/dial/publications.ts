import { DialFile } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { DialRule } from '@/src/models/dial/rule';

export interface Publication {
  path: string;
  requestName: string;
  author: string;
  createdAt: number;
  status: string;
  action: ActionType;
  folderId: string;
  prompts?: Partial<DialPrompt>[];
  files?: Partial<DialFile>[];
  rules?: DialRule[];
}

export enum ActionType {
  ADD = 'add',
  DELETE = 'delete',
}
