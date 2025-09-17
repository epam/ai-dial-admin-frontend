import { ErrorI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { ErrorType } from '@/src/types/error-type';
import { hasInvalidCharacters } from './name-error';
import { FORBIDDEN_NAME_SYMBOLS } from '@/src/constants/validation';

export const getErrorForFolderName = (
  name?: string,
  names?: (string | undefined)[],
  t?: (str: string) => string,
  checkForbiddenChars = true,
) => {
  const isIncludesName = name && names?.includes(name);
  if (isIncludesName) {
    return {
      type: ErrorType.EXISTING,
      text: t ? t(FoldersI18nKey.RenameFolderError) : '',
    };
  }

  const tWithArgs = t as (str: string, args?: Record<string, string | number>) => string;

  if (checkForbiddenChars) {
    const hasForbiddenChars = hasInvalidCharacters(name);
    if (hasForbiddenChars) {
      return {
        type: ErrorType.FORBIDDEN_CHARS,
        text: t ? tWithArgs(ErrorI18nKey.ForbiddenChars, { list: FORBIDDEN_NAME_SYMBOLS.join(' ') }) : '',
      };
    }
  }

  return null;
};
