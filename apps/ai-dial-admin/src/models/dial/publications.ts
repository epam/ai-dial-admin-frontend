import { DialFile } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { DialRule } from '@/src/models/dial/rule';
import { DialApplicationResource, DialToolsetResource } from '@/src/models/dial/application-resource';

export interface Publication {
  path: string;
  requestName: string;
  author: string;
  displayAuthor?: string;
  createdAt: string;
  status: string;
  action: ActionType;
  folderId: string;
  rules?: DialRule[];
  resourceIssues?: ResourceIssue[];
}

export interface PublicationEntity {
  sourceUrl: string;
  targetUrl: string;
  reviewUrl: string;
  action: ActionType;
}

export interface PublicationFile extends PublicationEntity {
  file: Partial<DialFile>;
}

export interface FilePublication extends Publication {
  files?: PublicationFile[];
}

export interface PublicationPrompt extends PublicationEntity {
  prompt: Partial<DialPrompt>;
}

export interface PromptPublication extends Publication {
  prompts?: PublicationPrompt[];
}

export interface PublicationToolset extends PublicationEntity {
  toolSetResource: DialToolsetResource;
}

export interface ToolsetPublication extends Publication {
  toolSetResources?: PublicationToolset[];
}

export interface PublicationApplication extends PublicationEntity {
  applicationResource: DialApplicationResource;
}

export interface ApplicationPublication extends Publication {
  applicationResources?: PublicationApplication[];
}

export interface ResourceIssue {
  message: string;
  path: string;
  resourceType: string;
}

export enum ActionType {
  ADD = 'add',
  ADD_IF_ABSENT = 'add_if_absent',
  DELETE = 'delete',
}
