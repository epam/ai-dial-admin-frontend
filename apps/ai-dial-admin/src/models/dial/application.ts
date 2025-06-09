import { DialBaseEntity } from './base-entity';

export interface DialApplication extends DialBaseEntity {
  customAppSchemaId?: string;
  maxRetryAttempts?: number;
}

export interface DialApplicationScheme {
  $schema?: string;
  $id?: string;
  description?: string;
  'dial:applicationTypeEditorUrl'?: string;
  'dial:applicationTypeViewerUrl'?: string;
  'dial:applicationTypeDisplayName'?: string;
  'dial:applicationTypeCompletionEndpoint'?: string;
  properties?: Record<string, unknown>;
  applications?: string[];
  topics?: string[];
}
