import { DialFile } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { DialRule } from '@/src/models/dial/rule';
import { DialApplicationResource, DialToolsetResource } from '@/src/models/dial/application-resource';

export interface Publication {
  path: string;
  requestName: string;
  author: string;
  createdAt: string;
  status: string;
  action: ActionType;
  folderId: string;
  rules?: DialRule[];
  missingResources?: MissingResource[];
}

export interface PromptPublication extends Publication {
  prompts?: Partial<DialPrompt>[];
}

export interface FilePublication extends Publication {
  files?: Partial<DialFile>[];
}

export interface ApplicationPublication extends Publication {
  applicationResources?: DialApplicationResource[];
}

export interface ToolsetPublication extends Publication {
  toolSetResources?: DialToolsetResource[];
}

export interface MissingResource {
  message: string;
  path: string;
  resourceType: string;
}

export enum ActionType {
  ADD = 'add',
  ADD_IF_ABSENT = 'add_if_absent',
  DELETE = 'delete',
}
