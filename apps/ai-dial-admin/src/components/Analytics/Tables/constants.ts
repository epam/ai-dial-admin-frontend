import { AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { AnalyticsTableType } from '@/src/models/analytics/table';

export const TABLE_TYPE_LABEL: Record<AnalyticsTableType, AnalyticsTablesI18nKey> = {
  [AnalyticsTableType.Source]: AnalyticsTablesI18nKey.TypeSource,
  [AnalyticsTableType.Enrichment]: AnalyticsTablesI18nKey.TypeEnrichment,
};
