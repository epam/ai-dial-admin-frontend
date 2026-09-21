import { describe, expect, test } from 'vitest';

import { isRateLimitScheduleValid } from '@/src/components/SystemProperties/utils/rate-limit-schedule';
import { RateLimitSchedule, WeekDay } from '@/src/models/system-properties';

const SCHEDULE: RateLimitSchedule = {
  timezone: 'Europe/Warsaw',
  weekStartDay: WeekDay.Sun,
  resetTime: '09:30',
};

describe('isRateLimitScheduleValid', () => {
  test('accepts a valid three-field schedule', () => {
    expect(isRateLimitScheduleValid(SCHEDULE)).toBe(true);
  });

  test('accepts Core-default values', () => {
    expect(isRateLimitScheduleValid({ timezone: 'UTC', weekStartDay: WeekDay.Mon, resetTime: '00:00' })).toBe(true);
  });

  test('accepts an undefined schedule — absence means Core defaults apply', () => {
    expect(isRateLimitScheduleValid(undefined)).toBe(true);
  });

  test('rejects a reset time outside the 24-hour HH:mm format', () => {
    expect(isRateLimitScheduleValid({ ...SCHEDULE, resetTime: '9:99' })).toBe(false);
    expect(isRateLimitScheduleValid({ ...SCHEDULE, resetTime: '25:00' })).toBe(false);
    expect(isRateLimitScheduleValid({ ...SCHEDULE, resetTime: '0930' })).toBe(false);
  });

  test('rejects a non-IANA timezone, including fixed offsets Core refuses', () => {
    expect(isRateLimitScheduleValid({ ...SCHEDULE, timezone: '+02:00' })).toBe(false);
    expect(isRateLimitScheduleValid({ ...SCHEDULE, timezone: 'Mars/Olympus' })).toBe(false);
  });

  test('rejects an unknown week start day', () => {
    expect(isRateLimitScheduleValid({ ...SCHEDULE, weekStartDay: 'Day' as WeekDay })).toBe(false);
  });

  test('rejects a schedule with missing fields, as a hand-edited blob can carry', () => {
    expect(isRateLimitScheduleValid({} as RateLimitSchedule)).toBe(false);
    expect(isRateLimitScheduleValid({ timezone: 'UTC' } as RateLimitSchedule)).toBe(false);
  });
});
