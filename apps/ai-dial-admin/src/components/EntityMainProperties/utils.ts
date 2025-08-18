import { CreateI18nKey } from '@/src/constants/i18n';
import { MAX_NAME_SYMBOLS, MIN_NAME_SYMBOLS } from '@/src/constants/validation';
import { ApplicationRoute } from '@/src/types/routes';
import { isWrongLengthWithView } from '@/src/utils/validation/name-error';

export const getDisplayNameErrorKeyPerView = (view: ApplicationRoute, wrongLength?: boolean) => {
  if (wrongLength) {
    return CreateI18nKey.MinMaxLength;
  }

  switch (view) {
    case ApplicationRoute.Models:
      return CreateI18nKey.DisplayNameErrorModel;

    case ApplicationRoute.Applications:
      return CreateI18nKey.ErrorUnique;

    default:
      return '';
  }
};

export const getVersionErrorKeyPerView = (view: ApplicationRoute) => {
  switch (view) {
    case ApplicationRoute.Models:
      return CreateI18nKey.VersionErrorModel;

    default:
      return '';
  }
};

export const getDisplayNameError = (
  view: ApplicationRoute,
  isValidDisplayName: boolean,
  displayName: string,
  t: (str: string, param?: Record<string, number>) => string,
) => {
  const errorKey = getDisplayNameErrorKeyPerView(view, isWrongLengthWithView(view, displayName));
  return isValidDisplayName ? '' : errorKey ? t(errorKey, { min: MIN_NAME_SYMBOLS, max: MAX_NAME_SYMBOLS }) : '';
};

export const getVersionError = (
  view: ApplicationRoute,
  isVersionOptional: boolean,
  displayVersion: string,
  t: (str: string, param?: Record<string, number>) => string,
) => {
  let error = '';
  if (!isVersionOptional) {
    const errorKey = getVersionErrorKeyPerView(view);
    const hasDisplayVersion = !!displayVersion;

    const isLengthError = hasDisplayVersion ? isWrongLengthWithView(view, displayVersion) : false;
    if (!hasDisplayVersion) {
      error = errorKey ? t(errorKey) : '';
    } else if (isLengthError) {
      error = t(CreateI18nKey.MinMaxLength, { min: MIN_NAME_SYMBOLS, max: MAX_NAME_SYMBOLS });
    } else {
      error = '';
    }
  }
  return error;
};
