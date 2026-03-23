import { ErrorI18nKey } from '@/src/constants/i18n';
import { checkNameVersionCombination } from '@/src/utils/prompts/versions';
import { BaseEntity } from '@/src/models/dial/base-entity';

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
