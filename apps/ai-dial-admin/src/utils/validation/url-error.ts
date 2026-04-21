import { ErrorI18nKey } from '@/src/constants/i18n';
import { ErrorType } from '@/src/types/error-type';

const ENDPOINT_REGEX =
  /^https?:\/\/[-a-zA-Z0-9@:%._+~#=]{1,256}(\.[a-zA-Z0-9()]{1,6})?\b(:[0-9]{1,5})?([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;

const WARNING_ENDPOINT_REGEX = /^http:\/\//;

export const isValidHttpUrl = (value: string) => {
  if (/\s/.test(value)) {
    return false;
  }

  let url: URL | null = null;

  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (url.pathname.includes('//')) {
    return false;
  }

  return (
    url &&
    ((url.protocol === 'http:' && value.startsWith('http://')) ||
      (url.protocol === 'https:' && value.startsWith('https://')))
  );
};

export const isValidEndpoint = (value: string) => {
  return ENDPOINT_REGEX.test(value);
};

export const isDangerEndpoint = (value?: string) => {
  return WARNING_ENDPOINT_REGEX.test(value || '');
};

export const getUrlError = (url?: string | null, t?: (str: string) => string, required?: boolean) => {
  if (!url && required) {
    return {
      type: ErrorType.EMPTY,
      text: t ? t(ErrorI18nKey.RequiredField) : '',
    };
  }

  if (url && !isValidHttpUrl(url)) {
    return {
      type: ErrorType.INVALID,
      text: t ? t(ErrorI18nKey.UrlField) : '',
    };
  }

  return null;
};
