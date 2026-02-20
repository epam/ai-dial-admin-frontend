import { ChatEntity, EntityValidityState, ModifiedEntity } from './base-entity';
import { DefaultsValue } from './defaults';
import { DialRoute } from './route';
import { DialScheme } from './scheme';

export interface DialApplication extends ChatEntity, EntityValidityState {
  customAppSchemaId?: string;
  viewerUrl?: string;
  editorUrl?: string;
  routes?: DialRoute[];
  displayVersion?: string;
  dependencies?: string[];
  applicationProperties?: Record<string, DefaultsValue>;
  applicationPropertiesTemp?: ApplicationPropertiesTemp[];
}

export interface DialApplicationScheme extends ModifiedEntity, DialScheme {
  $schema?: string;
  $id?: string;
  description?: string;
  title?: string;
  type?: TypeEntity;
  applicationTypeSchemaEndpoint?: string;
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
  'dial:applicationTypeAssistantAttachmentsInRequestSupported'?: boolean;
  'dial:applicationTypeIconUrl'?: string;
  'dial:applicationTypeBucketCopy'?: TypeBucketCopy;
  'dial:applicationTypeInterceptors'?: string[];
  applications?: string[];
  topics?: string[];
}

export enum TypeEntity {
  OBJECT = 'object',
  BOOLEAN = 'boolean',
  ARRAY = 'array',
  STRING = 'string',
  NUMBER = 'number',
  NULL = 'null',
}

export enum TypeBucketCopy {
  DISABLED = 'DISABLED',
  ENABLED = 'ENABLED',
}

export interface ApplicationPropertiesTemp {
  key: string;
  value: DefaultsValue;
  type: string;
  required: boolean;
  isFromScheme?: boolean;
}
