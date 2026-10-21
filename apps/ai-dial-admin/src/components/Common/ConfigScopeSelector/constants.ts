import { ExportI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { ExportComponentType } from '@/src/types/export';

export const SCOPE_LABEL_KEYS: Record<ExportComponentType, string> = {
  [ExportComponentType.ADMIN]: ExportI18nKey.EntitiesBuildersAccess,
  [ExportComponentType.DEPLOYMENTS]: ExportI18nKey.Deployments,
  [ExportComponentType.ANALYTICS]: MenuI18nKey.Analytics,
};
