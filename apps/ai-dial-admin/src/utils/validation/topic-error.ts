import { ErrorType } from '@/src/types/error-type';
import { ErrorI18nKey } from '@/src/constants/i18n';
import { MAX_NAME_SYMBOLS, MIN_NAME_SYMBOLS } from '@/src/constants/validation';

export const getTopicError = (
  value?: string,
  t?: (key: string, options?: Record<string, string | number>) => string,
) => {
  if (value && (value.length < MIN_NAME_SYMBOLS || value.length > MAX_NAME_SYMBOLS)) {
    return {
      type: ErrorType.LENGTH,
      text: t
        ? t(ErrorI18nKey.MinMaxLength, {
            min: MIN_NAME_SYMBOLS,
            max: MAX_NAME_SYMBOLS,
          })
        : '',
    };
  }
  return null;
};
