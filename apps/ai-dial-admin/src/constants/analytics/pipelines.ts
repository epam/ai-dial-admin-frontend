import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';

export const LATEST_VERSION = 'latest';

export const CRON_CUSTOM_PRESET = 'custom';

export const CRON_PRESETS: { value: string; labelKey: AnalyticsPipelinesI18nKey }[] = [
  { value: '0 */5 * * * *', labelKey: AnalyticsPipelinesI18nKey.CronEveryFiveMinutes },
  { value: '0 0 * * * *', labelKey: AnalyticsPipelinesI18nKey.CronHourly },
  { value: '0 0 0 * * *', labelKey: AnalyticsPipelinesI18nKey.CronDailyMidnight },
];

// The service's own ceiling on a group's member fetch (ENRICHMENT_GROUP_FETCH_MAX_ROWS). Not exposed on
// any read endpoint, so this mirrors the documented default; a deployment configured lower rejects the
// save and the service's message is surfaced.
export const GROUP_FETCH_MAX_ROWS = 2000;

// A numeric knob holds at most a few digits, so the input is sized to its value. Applied to the input
// wrapper rather than the container, which also holds the caption — constraining that wraps it to a
// column of two-word lines.
export const NUMBER_INPUT_WIDTH = 'max-w-[150px]';
