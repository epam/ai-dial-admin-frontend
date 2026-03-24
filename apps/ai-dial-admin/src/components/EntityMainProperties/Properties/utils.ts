import { ErrorI18nKey } from '@/src/constants/i18n';
import { MAX_NAME_SYMBOLS, MIN_NAME_SYMBOLS } from '@/src/constants/validation';
import { ApplicationRoute } from '@/src/types/routes';
import { isWrongFieldLength } from '@/src/utils/validation/name-error';
import { DialModel } from '@/src/models/dial/model';
import { isEntitiesWithDisplayVersion } from '@/src/utils/is-view';

export const getDisplayNameError = (
  view: ApplicationRoute,
  displayName: string,
  names: string[],
  t: (str: string, param?: Record<string, number | string>) => string,
  version?: string,
) => {
  const isWrongLength = isWrongFieldLength(displayName);
  if (isWrongLength) {
    return t(ErrorI18nKey.MinMaxLength, { min: MIN_NAME_SYMBOLS, max: MAX_NAME_SYMBOLS });
  }

  if (isEntitiesWithDisplayVersion(view)) {
    return names.includes(displayName) && !version ? t(ErrorI18nKey.DisplayNameErrorVersion) : '';
  }

  if (view === ApplicationRoute.Toolsets) {
    return names.includes(displayName) ? t(ErrorI18nKey.DisplayNameExists) : '';
  }

  return '';
};

export const getVersionError = (
  isVersionOptional: boolean,
  model: DialModel,
  versionsMap: Record<string, string[]>,
  t: (str: string, param?: Record<string, number>) => string,
) => {
  if (!isVersionOptional) {
    const hasDisplayVersion = !!model.displayVersion;

    if (!hasDisplayVersion) {
      return t(ErrorI18nKey.Version);
    }

    if (model.displayVersion && model.displayVersion.length > MAX_NAME_SYMBOLS) {
      return t(ErrorI18nKey.Length, { number: MAX_NAME_SYMBOLS });
    }

    if (versionsMap[model.displayName as string]?.includes(model.displayVersion || '')) {
      return t(ErrorI18nKey.Unique);
    }
  }
  return '';
};
