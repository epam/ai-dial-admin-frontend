import { ErrorI18nKey } from '@/src/constants/i18n';
import { ErrorType } from '@/src/types/error-type';
import { getUrlError } from '@/src/utils/validation/url-error';

export const PLUGIN_URL_PREFIX = 'dial-plugin://';

export const isPluginUrl = (value?: string): boolean => value?.startsWith(PLUGIN_URL_PREFIX) ?? false;

export const getPluginName = (value?: string): string | undefined => {
  if (!isPluginUrl(value)) return undefined;
  return value?.slice(PLUGIN_URL_PREFIX.length).split('/')[0];
};

export const getPluginReference = (name: string): string => `${PLUGIN_URL_PREFIX}${name}`;

export const getBaseUrlError = (value: string | undefined, t: (key: string) => string, required?: boolean) => {
  if (!isPluginUrl(value)) return getUrlError(value, t, required);
  if (!getPluginName(value)?.trim()) {
    return { type: ErrorType.INVALID, text: t(ErrorI18nKey.PluginUrl) };
  }
  return null;
};
