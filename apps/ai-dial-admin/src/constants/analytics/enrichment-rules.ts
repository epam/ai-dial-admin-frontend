import { AnalyticsEnrichmentRulesI18nKey } from '@/src/constants/i18n';

export const LATEST_VERSION = 'latest';

export const CRON_CUSTOM_PRESET = 'custom';

export const CRON_PRESETS: { value: string; labelKey: AnalyticsEnrichmentRulesI18nKey }[] = [
  { value: '0 */5 * * * *', labelKey: AnalyticsEnrichmentRulesI18nKey.CronEveryFiveMinutes },
  { value: '0 0 * * * *', labelKey: AnalyticsEnrichmentRulesI18nKey.CronHourly },
  { value: '0 0 0 * * *', labelKey: AnalyticsEnrichmentRulesI18nKey.CronDailyMidnight },
];
