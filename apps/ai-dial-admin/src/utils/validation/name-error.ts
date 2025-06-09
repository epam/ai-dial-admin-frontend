import { CreateI18nKey } from '@/src/constants/i18n';
import { MAX_NAME_SYMBOLS, MIN_NAME_SYMBOLS } from '@/src/constants/validation';
import { ErrorType } from '@/src/types/error-type';

export const getErrorForName = (
  name?: string,
  names?: string[],
  t?: (str: string) => string,
  isUniqueError?: boolean,
) => {
  const isIncludesName = name && names?.includes(name);
  const isWrongLength = name && (name.length < MIN_NAME_SYMBOLS || name.length > MAX_NAME_SYMBOLS);

  if (isIncludesName) {
    return {
      type: ErrorType.EXISTING,
      text: t ? t(CreateI18nKey.ErrorName) : '',
    };
  }
  if (isWrongLength) {
    return {
      type: ErrorType.LENGTH,
      text: t ? t(CreateI18nKey.LengthError) : '',
    };
  }
  if (isUniqueError) {
    return {
      type: ErrorType.EXISTING,
      text: t ? t(CreateI18nKey.ErrorUnique) : '',
    };
  }
  return null;
};
