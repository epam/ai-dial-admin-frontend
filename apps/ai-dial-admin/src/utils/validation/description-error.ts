import { CreateI18nKey } from '@/src/constants/i18n';
import { MAX_DESCRIPTION_SYMBOLS } from '@/src/constants/validation';
import { ErrorType } from '@/src/types/error-type';

export const getErrorForDescription = (description?: string, t?: (str: string) => string) => {
  const isWrongLength = description && description?.length > MAX_DESCRIPTION_SYMBOLS;

  if (isWrongLength) {
    return {
      type: ErrorType.LENGTH,
      text: t ? t(CreateI18nKey.DescriptionLengthError) : '',
    };
  }
  return null;
};
