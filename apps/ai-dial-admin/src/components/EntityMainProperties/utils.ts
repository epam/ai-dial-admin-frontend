import { ErrorI18nKey } from '@/src/constants/i18n';
import { MAX_NAME_SYMBOLS, MIN_NAME_SYMBOLS } from '@/src/constants/validation';
import { ApplicationRoute } from '@/src/types/routes';
import { isWrongFieldLength } from '@/src/utils/validation/name-error';

export const getDisplayNameError = (
  view: ApplicationRoute,
  displayName: string,
  names: string[],
  t: (str: string, param?: Record<string, number>) => string,
  version?: string,
) => {
  const isWrongLength = isWrongFieldLength(displayName);
  if (isWrongLength) {
    return t(ErrorI18nKey.MinMaxLength, { min: MIN_NAME_SYMBOLS, max: MAX_NAME_SYMBOLS });
  }

  if (view === ApplicationRoute.Models) {
    return names.includes(displayName) && !version ? t(ErrorI18nKey.DisplayNameErrorModel) : '';
  }

  return '';
};

export const getVersionError = (
  isVersionOptional: boolean,
  displayVersion: string,
  t: (str: string, param?: Record<string, number>) => string,
) => {
  if (!isVersionOptional) {
    const hasDisplayVersion = !!displayVersion;

    if (!hasDisplayVersion) {
      return t(ErrorI18nKey.Version);
    }
  }
  return '';
};
