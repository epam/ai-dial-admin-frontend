import { CreateI18nKey } from '@/src/constants/i18n';
import { MAX_NAME_SYMBOLS } from '@/src/constants/validation';
import { ApplicationRoute } from '@/src/types/routes';

export const isWrongLength = (view: ApplicationRoute, field?: string): boolean => {
  return (
    (view === ApplicationRoute.Applications || view === ApplicationRoute.Models) &&
    (field ? field.length > MAX_NAME_SYMBOLS : false)
  );
};

export const getDisplayNameErrorKeyPerView = (view: ApplicationRoute, wrongLength?: boolean) => {
  if (wrongLength) {
    return CreateI18nKey.ErrorLength;
  }
  switch (view) {
    case ApplicationRoute.Models:
      return CreateI18nKey.DisplayNameErrorModel;

    case ApplicationRoute.Applications:
      return CreateI18nKey.DisplayNameErrorApplication;

    case ApplicationRoute.Addons:
      return CreateI18nKey.DisplayNameErrorAddon;

    default:
      return '';
  }
};

export const getVersionErrorKeyPerView = (view: ApplicationRoute) => {
  switch (view) {
    case ApplicationRoute.Models:
      return CreateI18nKey.VersionErrorModel;

    case ApplicationRoute.Addons:
      return CreateI18nKey.VersionErrorAddon;

    case ApplicationRoute.Applications:
      return CreateI18nKey.VersionErrorApplication;

    default:
      return '';
  }
};
