import { describe, expect, test } from 'vitest';

import { formatWeekLabel, getWeekRange, getWeekStart } from '@/src/components/Analytics/Usage/utils/weeks';

// Local dates throughout: the heatmap's week is the reader's own week, not a UTC one.
const local = (year: number, month: number, day: number, hour = 0) => new Date(year, month - 1, day, hour);

describe('getWeekStart', () => {
  test('moves a mid-week day back to its Monday', () => {
    expect(getWeekStart(local(2026, 9, 17, 15))).toEqual(local(2026, 9, 14));
  });

  test('leaves a Monday where it is, at the start of the day', () => {
    expect(getWeekStart(local(2026, 9, 14, 23))).toEqual(local(2026, 9, 14));
  });

  test('treats Sunday as the last day of its week, not the first', () => {
    expect(getWeekStart(local(2026, 9, 20))).toEqual(local(2026, 9, 14));
  });
});

describe('getWeekRange', () => {
  test('covers exactly seven days from the Monday of the reference week', () => {
    expect(getWeekRange(0, local(2026, 9, 17))).toEqual({
      startDate: local(2026, 9, 14),
      endDate: local(2026, 9, 21),
    });
  });

  test('steps a whole week back per offset', () => {
    expect(getWeekRange(2, local(2026, 9, 17)).startDate).toEqual(local(2026, 8, 31));
  });

  test('crosses a month boundary without losing a day', () => {
    expect(getWeekRange(0, local(2026, 10, 1))).toEqual({
      startDate: local(2026, 9, 28),
      endDate: local(2026, 10, 5),
    });
  });
});

describe('formatWeekLabel', () => {
  test('names both ends of the week', () => {
    const label = formatWeekLabel(getWeekRange(0, local(2026, 9, 17)));

    expect(label).toContain('14');
    expect(label).toContain('20');
  });

  test('ends on the last day of the week rather than the exclusive bound', () => {
    expect(formatWeekLabel(getWeekRange(0, local(2026, 9, 17)))).not.toContain('21');
  });
});
