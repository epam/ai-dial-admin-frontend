import { BaseEntity, EntityDefaults } from '@/src/models/dial/base-entity';
import { ApplicationPropertiesTemp } from './application';
import { DefaultsValue } from './defaults';

export interface DialApplicationResource extends BaseEntity, EntityDefaults {
  applicationTypeSchemaId: string;
  descriptionKeywords: string[];
  inputAttachmentTypes: string[];
  dependencies: string[];
  interceptors: string[];
  path: string;
  folderId: string;
  version: string;
  author: string;
  endpoint: string;
  iconUrl: string;
  reference: string;
  maxRetryAttempts: number;
  forwardAuthToken: boolean;
  editorUrl: string;
  viewerUrl: string;
  applicationProperties?: Record<string, DefaultsValue>;
  applicationPropertiesTemp?: ApplicationPropertiesTemp[];
}

export interface DialToolsetResource extends BaseEntity {
  descriptionKeywords: string[];
  path: string;
  folderId: string;
  version: string;
  author: string;
  endpoint: string;
  iconUrl: string;
  maxRetryAttempts: number;
}
