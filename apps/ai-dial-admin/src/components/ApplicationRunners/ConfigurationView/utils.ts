import { CreateI18nKey } from '@/src/constants/i18n';
import { MAX_RUNNER_ID_SYMBOLS } from '@/src/constants/validation';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { ErrorType } from '@/src/types/error-type';
import { isValidHttpUrl } from '@/src/utils/validation/is-valid-url';
import { cloneDeep } from 'lodash';

export const clearSchemeForEditor = (scheme: DialApplicationScheme) => {
  const clonedScheme = cloneDeep(scheme);
  delete clonedScheme.$id;
  delete clonedScheme.$schema;
  delete clonedScheme.description;
  delete clonedScheme['dial:applicationTypeCompletionEndpoint'];
  delete clonedScheme['dial:applicationTypeViewerUrl'];
  delete clonedScheme['dial:applicationTypeEditorUrl'];
  delete clonedScheme['dial:applicationTypeDisplayName'];

  return clonedScheme;
};

export const getErrorForAppRunnerId = (id?: string, t?: (str: string, param?: Record<string, number>) => string) => {
  const isWrongId = id && !isValidHttpUrl(id);
  const isWrongLength = !!id && id?.length > MAX_RUNNER_ID_SYMBOLS;
  if (isWrongId) {
    return {
      type: ErrorType.ID_URL,
      text: t ? t(CreateI18nKey.IdUrlError) : '',
    };
  }
  if (isWrongLength) {
    return {
      type: ErrorType.LENGTH,
      text: t ? t(CreateI18nKey.ErrorLength, { number: MAX_RUNNER_ID_SYMBOLS }) : '',
    };
  }
  return null;
};
