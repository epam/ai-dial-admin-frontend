import { ErrorI18nKey } from '@/src/constants/i18n';
import { MAX_INTRO_SYMBOLS } from '@/src/constants/validation';
import { ErrorType } from '@/src/types/error-type';

export const getErrorForIntro = (intro?: string, t?: (str: string) => string) => {
  const isWrongLength = intro && intro?.length > MAX_INTRO_SYMBOLS;

  if (isWrongLength) {
    return {
      type: ErrorType.LENGTH,
      text: t ? t(ErrorI18nKey.IntroLength) : '',
    };
  }
  return null;
};
