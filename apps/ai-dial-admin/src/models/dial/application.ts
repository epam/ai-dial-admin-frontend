import { SOURCE_FIELD } from '@/src/components/SourceField/types';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { ChatEntity, EntityValidityState, ModifiedEntity } from './base-entity';
import { DialRoute } from './route';
import { DialScheme } from './scheme';

export { SOURCE_TYPE as ApplicationSourceType } from '@/src/components/SourceField/types';

export interface DialApplication extends ChatEntity, EntityValidityState {
  source?: SOURCE_FIELD;
  viewerUrl?: string;
  editorUrl?: string;
  routes?: DialRoute[];
  displayVersion?: string;
  dependencies?: string[];
  applicationProperties?: Record<string, unknown>;
  mcp?: ApplicationMCPContainer;
  responsesEndpoint?: string;
}

export interface DialApplicationScheme extends ModifiedEntity, DialScheme {
  $schema?: string;
  $id?: string;
  description?: string;
  title?: string;
  type?: TypeEntity;
  'dial:applicationTypeSchemaEndpoint'?: string;
  'dial:applicationTypeEditorUrl'?: string;
  'dial:applicationTypeViewerUrl'?: string;
  'dial:applicationTypeDisplayName'?: string;
  'dial:applicationTypeCompletionEndpoint'?: string;
  'dial:applicationTypeResponsesEndpoint'?: string;
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
  'dial:applicationTypeMcp'?: ApplicationTypeMCP;

  applications?: string[];
  topics?: string[];
}

export interface ApplicationTypeMCP {
  ['dial:endpoint']: string;
  ['dial:transport']?: string;
  ['dial:forwardPerRequestKey']?: boolean;
  ['dial:mcpConfigDelivery']?: ApplicationMCPConfigDelivery;
  ['dial:allowedTools']?: string[];
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

export interface ApplicationMCPContainer {
  endpoint: string;
  transport?: string;
  allowedTools?: string[];
}

export enum ApplicationMCPConfigDelivery {
  META = 'meta',
  HEADER = 'header',
}

export const MCP_CONFIG_DELIVERY_I18N_MAP: Record<ApplicationMCPConfigDelivery, EntityFieldsI18nKey> = {
  [ApplicationMCPConfigDelivery.META]: EntityFieldsI18nKey.configDeliveryMeta,
  [ApplicationMCPConfigDelivery.HEADER]: EntityFieldsI18nKey.configDeliveryHeader,
};
