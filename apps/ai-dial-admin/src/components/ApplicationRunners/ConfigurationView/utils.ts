import { DialApplicationScheme } from '@/src/models/dial/application';
import { cloneDeep } from 'lodash';

const fields: (keyof DialApplicationScheme)[] = [
  '$id',
  '$schema',
  'description',
  'applications',
  'topics',
  'updatedAt',
  'createdAt',
  'title',
  'type',
  'applicationTypeSchemaEndpoint',
  'dial:applicationTypeRoutes',
  'dial:applicationTypeCompletionEndpoint',
  'dial:applicationTypeViewerUrl',
  'dial:applicationTypeEditorUrl',
  'dial:applicationTypeDisplayName',
  'dial:applicationTypeConfigurationEndpoint',
  'dial:applicationTypeRateEndpoint',
  'dial:applicationTypeTokenizeEndpoint',
  'dial:applicationTypeTruncatePromptEndpoint',
  'dial:appendApplicationPropertiesHeader',
  'dial:applicationTypePlaybackSupport',
  'dial:applicationTypeAssistantAttachmentsInRequestSupported',
  'dial:applicationTypeIconUrl',
  'dial:applicationTypeBucketCopy',
];

export const clearSchemeForEditor = (scheme: DialApplicationScheme) => {
  const clonedScheme = cloneDeep(scheme);

  fields.forEach((field) => {
    if (clonedScheme[field] != null) {
      delete clonedScheme[field];
    }
  });
  return clonedScheme;
};
