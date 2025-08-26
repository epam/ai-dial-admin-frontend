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
  'dial:applicationTypeIconUrl',
];

export const clearSchemeForEditor = (scheme: DialApplicationScheme) => {
  const clonedScheme = cloneDeep(scheme);

  fields.forEach((field) => {
    if (clonedScheme[field]) {
      delete clonedScheme[field];
    }
  });
  return clonedScheme;
};
