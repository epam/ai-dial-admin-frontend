import { ErrorI18nKey } from '@/src/constants/i18n';
import { MAX_RUNNER_ID_SYMBOLS } from '@/src/constants/validation';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { ErrorType } from '@/src/types/error-type';
import { isValidHttpUrl } from '@/src/utils/validation/url-error';
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

export const getErrorForAppRunnerId = (id?: string, t?: (str: string, param?: Record<string, number>) => string) => {
  const isWrongId = id && !isValidHttpUrl(id);
  const isWrongLength = !!id && id?.length > MAX_RUNNER_ID_SYMBOLS;
  if (isWrongId) {
    return {
      type: ErrorType.INVALID,
      text: t ? t(ErrorI18nKey.UrlField) : '',
    };
  }
  if (isWrongLength) {
    return {
      type: ErrorType.LENGTH,
      text: t ? t(ErrorI18nKey.Length, { number: MAX_RUNNER_ID_SYMBOLS }) : '',
    };
  }
  return null;
};
