import { ErrorI18nKey } from '@/src/constants/i18n';
import { MAX_NAME_SYMBOLS, MIN_NAME_SYMBOLS } from '@/src/constants/validation';
import { ApplicationRoute } from '@/src/types/routes';
import { isWrongLengthWithView } from '@/src/utils/validation/name-error';

export const getDisplayNameError = (
  view: ApplicationRoute,
  displayName: string,
  names: string[],
  t: (str: string, param?: Record<string, number>) => string,
  version?: string,
) => {
  const isWrongLength = isWrongLengthWithView(view, displayName);
  if (isWrongLength) {
    return t(ErrorI18nKey.MinMaxLength, { min: MIN_NAME_SYMBOLS, max: MAX_NAME_SYMBOLS });
  }

  if (view === ApplicationRoute.Models) {
    return names.includes(displayName) && !!version ? t(ErrorI18nKey.DisplayNameErrorModel) : '';
  }
  // TODO: review - ErrorI18nKey.Unique restore?
  return '';
};

export const getVersionError = (
  view: ApplicationRoute,
  isVersionOptional: boolean,
  displayVersion: string,
  t: (str: string, param?: Record<string, number>) => string,
) => {
  if (!isVersionOptional) {
    const hasDisplayVersion = !!displayVersion;

    const isLengthError = hasDisplayVersion ? isWrongLengthWithView(view, displayVersion) : false;
    if (!hasDisplayVersion) {
      return t(ErrorI18nKey.Version);
    }
    if (isLengthError) {
      return t(ErrorI18nKey.MinMaxLength, { min: MIN_NAME_SYMBOLS, max: MAX_NAME_SYMBOLS });
    }
  }
  return '';
};
