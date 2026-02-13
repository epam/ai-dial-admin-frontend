import { ErrorI18nKey } from '@/src/constants/i18n';
import { ErrorType } from '@/src/types/error-type';

const IPv4_REGEX = /^((25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)$/;
const IPv6_REGEX =
  /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(([0-9a-fA-F]{1,4}:){1,7}:)|(([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})|(([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2})|(([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3})|(([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4})|(([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5})|([0-9a-fA-F]{1,4}:)((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9])?[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9])?[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9])?[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9])?[0-9]))$/;

export const isValidIpAddress = (ipAddress: string) => {
  return IPv4_REGEX.test(ipAddress) || IPv6_REGEX.test(ipAddress);
};

export const isValidIpMask = (mask: number, min: number, max: number) => {
  return mask >= min && mask <= max;
};

export const getIpAddressError = (ipAddress?: string | null, t?: (str: string) => string, required?: boolean) => {
  if (!ipAddress && required) {
    return {
      type: ErrorType.EMPTY,
      text: t ? t(ErrorI18nKey.EmptyIpRangeField) : '',
    };
  }

  if (ipAddress && !isValidIpAddress(ipAddress)) {
    return {
      type: ErrorType.INVALID,
      text: t ? t(ErrorI18nKey.InvalidIpAddress) : '',
    };
  }

  return null;
};

export const getIPMaskError = (
  mask?: number | null,
  t?: (str: string) => string,
  required?: boolean,
  min?: number,
  max?: number,
) => {
  const tWithArgs = t as (str: string, args?: Record<string, string | number>) => string;
  const minValue = min || 0;
  const maxValue = max || 24;
  if (!mask && required) {
    return {
      type: ErrorType.EMPTY,
      text: t ? t(ErrorI18nKey.EmptyIpRangeField) : '',
    };
  }

  if (mask && !isValidIpMask(mask, minValue, maxValue)) {
    return {
      type: ErrorType.INVALID,
      text: tWithArgs ? tWithArgs(ErrorI18nKey.MinMaxMask, { min: minValue, max: maxValue }) : '',
    };
  }

  return null;
};
