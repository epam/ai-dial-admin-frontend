import { ErrorI18nKey } from '@/src/constants/i18n';
import { checkNameVersionCombination } from '@/src/utils/prompts/versions';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { ErrorType } from '@/src/types/error-type';
import { MAX_NAME_SYMBOLS } from '@/src/constants/validation';

export const getPromptVersionError = (
  versionsMap: Record<string, string[]> | undefined,
  entity: BaseEntity,
  t: (str: string) => string,
  version?: string,
) => {
  const isValidVersion = !checkNameVersionCombination(versionsMap, entity.name as string, version || '');
  if (!(isValidVersion && versionsMap)) {
    return t(ErrorI18nKey.NameVersionCombination);
  }
  return !version ? t(ErrorI18nKey.EmptyField) : void 0;
};

export const getVersionControlError = (
  version?: string,
  required?: boolean,
  hideError?: boolean,
  t?: (str: string, options?: Record<string, string | number>) => string,
) => {
  if (!version && required && !hideError) {
    return {
      type: ErrorType.EMPTY,
      text: t ? t(ErrorI18nKey.RequiredField) : '',
    };
  }

  if (version && version.length > MAX_NAME_SYMBOLS) {
    return {
      type: ErrorType.LENGTH,
      text: t ? t(ErrorI18nKey.Length, { number: MAX_NAME_SYMBOLS }) : '',
    };
  }

  return null;
};
