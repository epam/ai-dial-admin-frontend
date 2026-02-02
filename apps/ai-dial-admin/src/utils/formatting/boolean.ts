import { BasicI18nKey } from '@/src/constants/i18n';

export const formatRequired = (value: string, t: (stringToTranslate: string) => string) => {
  return value ? t(BasicI18nKey.Yes) : t(BasicI18nKey.No);
};
