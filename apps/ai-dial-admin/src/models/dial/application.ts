import { DialBaseEntity, DialModifiedEntity } from './base-entity';
import { DialRoute } from './route';

export interface DialApplication extends DialBaseEntity {
  customAppSchemaId?: string;
  maxRetryAttempts?: number;
  viewerUrl?: string;
  editorUrl?: string;
  routes?: DialRoute[];
}

export interface DialApplicationScheme extends DialModifiedEntity {
  $schema?: string;
  $id?: string;
  description?: string;
  title?: string;
  type?: TypeEntity;
  properties?: Record<string, unknown>;
  applications?: string[];
  topics?: string[];
  'dial:applicationTypeEditorUrl'?: string;
  'dial:applicationTypeViewerUrl'?: string;
  'dial:applicationTypeDisplayName'?: string;
  'dial:applicationTypeCompletionEndpoint'?: string;
  'dial:applicationTypeConfigurationEndpoint'?: string;
  'dial:applicationTypeRateEndpoint'?: string;
  'dial:applicationTypeTokenizeEndpoint'?: string;
  'dial:applicationTypeTruncatePromptEndpoint'?: string;
  'dial:appendApplicationPropertiesHeader'?: boolean;
  'dial:applicationTypeRoutes'?: DialRoute[];
  'dial:applicationTypePlaybackSupport'?: boolean;
  'dial:applicationTypeIconUrl'?: string;
}

export enum TypeEntity {
  OBJECT = 'object',
  BOOLEAN = 'boolean',
}
