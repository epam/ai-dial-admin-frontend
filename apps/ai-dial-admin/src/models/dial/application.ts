import { DialBaseEntity } from './base-entity';

export interface DialApplication extends DialBaseEntity {
  customAppSchemaId?: string;
  maxRetryAttempts?: number;
  viewerUrl?: string;
  editorUrl?: string;
}

export interface DialApplicationScheme {
  $schema?: string;
  $id?: string;
  description?: string;
  title?: string;
  type?: TypeEntity;
  'dial:applicationTypeEditorUrl'?: string;
  'dial:applicationTypeViewerUrl'?: string;
  'dial:applicationTypeDisplayName'?: string;
  'dial:applicationTypeCompletionEndpoint'?: string;
  'dial:applicationTypeConfigurationEndpoint'?: string;
  'dial:applicationTypeRateEndpoint'?: string;
  'dial:applicationTypeTokenizeEndpoint'?: string;
  'dial:applicationTypeTruncatePromptEndpoint'?: string;
  'dial:appendApplicationPropertiesHeader'?: boolean;
  properties?: Record<string, unknown>;
  applications?: string[];
  createdAt?: number;
  updatedAt?: number;
  topics?: string[];
}

export enum TypeEntity {
  OBJECT = 'object',
  BOOLEAN = 'boolean',
}
