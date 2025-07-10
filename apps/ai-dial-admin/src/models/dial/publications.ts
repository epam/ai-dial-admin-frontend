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
  rules?: DialRule[];
}

export interface PromptPublication extends Publication {
  prompts?: Partial<DialPrompt>[];
}

export interface FilePublication extends Publication {
  files?: Partial<DialFile>[];
}

export interface ApplicationPublication extends Publication {
  files?: Partial<DialFile>[];
}

export enum ActionType {
  ADD = 'add',
  DELETE = 'delete',
}
