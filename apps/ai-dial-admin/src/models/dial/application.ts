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
  topics?: string[];
}
