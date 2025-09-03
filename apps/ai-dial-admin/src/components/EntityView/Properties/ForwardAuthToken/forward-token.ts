import { EntitiesI18nKey, ForwardTokenI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';

export const NONE_ID = 'forwardFalse';
export const USE_ID = 'forwardTrue';

export const isForwardTokenTrue = (value: string): boolean => {
  return value === USE_ID;
};

export const isForwardTokenFalse = (value: string): boolean => {
  return value === NONE_ID;
};

export const getAlertTitlePerView = (view: ApplicationRoute): string => {
  switch (view) {
    case ApplicationRoute.Models:
      return ForwardTokenI18nKey.UseForThisModel;

    case ApplicationRoute.Applications:
      return ForwardTokenI18nKey.UseForThisApplication;

    case ApplicationRoute.Interceptors:
      return ForwardTokenI18nKey.UseForThisInterceptor;

    default:
      return '';
  }
};

export const getDisplayNamePerView = (view: ApplicationRoute): string => {
  switch (view) {
    case ApplicationRoute.Models:
      return EntitiesI18nKey.ModelDisplayName;

    case ApplicationRoute.Applications:
      return EntitiesI18nKey.ApplicationDisplayName;

    case ApplicationRoute.Interceptors:
      return EntitiesI18nKey.InterceptorName;

    default:
      return '';
  }
};
