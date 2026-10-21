import { RateLimitSchedule, WeekDay } from '@/src/models/system-properties';
import { RESET_TIME_PATTERN } from '../constants';

const WEEK_DAYS = new Set<string>(Object.values(WeekDay));

// Core's ValidTimezone accepts exactly the IANA region ids. `Intl.supportedValuesOf` returns the
// same set except 'UTC', which ECMA-402 omits — added back so Core's default timezone stays valid
// and selectable.
export const SUPPORTED_TIMEZONES: string[] = ['UTC', ...Intl.supportedValuesOf('timeZone')];

const TIMEZONES = new Set<string>(SUPPORTED_TIMEZONES);

/**
 * Mirrors Core's validation so an invalid schedule disables Save before it can be sent. Also gates
 * a blob hand-edited outside the API: a stored invalid value keeps Save off until corrected.
 * `undefined` is valid — an absent schedule just means Core's defaults apply.
 */
export const isRateLimitScheduleValid = (schedule?: RateLimitSchedule): boolean => {
  if (!schedule) {
    return true;
  }

  return (
    TIMEZONES.has(schedule.timezone) &&
    WEEK_DAYS.has(schedule.weekStartDay) &&
    RESET_TIME_PATTERN.test(schedule.resetTime)
  );
};
