import { ChatEntity, ModifiedEntity } from './base-entity';
import { DialFeatures } from './features';
import { DialRoute } from './route';

export interface DialApplication extends ChatEntity {
  customAppSchemaId?: string;
  viewerUrl?: string;
  editorUrl?: string;
  features?: DialFeatures;
  routes?: DialRoute[];
}

export interface DialApplicationScheme extends ModifiedEntity {
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
  'dial:applicationTypeRoutes'?: DialRoute[];
  'dial:applicationTypePlaybackSupport'?: boolean;
  'dial:applicationTypeIconUrl'?: string;
  properties?: Record<string, unknown>;
  applications?: string[];
  topics?: string[];
}

export enum TypeEntity {
  OBJECT = 'object',
  BOOLEAN = 'boolean',
}
