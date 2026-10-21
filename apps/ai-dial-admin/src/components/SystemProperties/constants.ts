import { SystemPropertiesI18nKey } from '@/src/constants/i18n';
import { RateLimitSchedule, WeekDay } from '@/src/models/system-properties';

/** Core's implicit values when `rateLimitSchedule` is omitted from the settings blob. */
export const DEFAULT_RATE_LIMIT_SCHEDULE: RateLimitSchedule = {
  timezone: 'UTC',
  weekStartDay: WeekDay.Mon,
  resetTime: '00:00',
};

/** Mirrors Core's `resetTime` pattern so an invalid schedule cannot be sent (see design D3). */
export const RESET_TIME_PATTERN = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

export const WEEK_DAY_I18N_KEYS: Record<WeekDay, SystemPropertiesI18nKey> = {
  [WeekDay.Mon]: SystemPropertiesI18nKey.WeekdayMonday,
  [WeekDay.Tue]: SystemPropertiesI18nKey.WeekdayTuesday,
  [WeekDay.Wed]: SystemPropertiesI18nKey.WeekdayWednesday,
  [WeekDay.Thu]: SystemPropertiesI18nKey.WeekdayThursday,
  [WeekDay.Fri]: SystemPropertiesI18nKey.WeekdayFriday,
  [WeekDay.Sat]: SystemPropertiesI18nKey.WeekdaySaturday,
  [WeekDay.Sun]: SystemPropertiesI18nKey.WeekdaySunday,
};
