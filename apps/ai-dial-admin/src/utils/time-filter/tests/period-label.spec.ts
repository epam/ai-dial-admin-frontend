import { describe, expect, test } from 'vitest';

import { timePeriodOptionsConfig } from '@/src/constants/global-time-filter';
import { TimeRange } from '@/src/models/time-range';
import { timePeriodLabel } from '@/src/utils/time-filter/period-label';

const RANGE: TimeRange = {
  startDate: new Date('2026-03-01T00:00:00.000Z'),
  endDate: new Date('2026-03-03T23:59:59.000Z'),
};

describe('timePeriodLabel', () => {
  // The control renders "Last 7d" for the id "7d". A pill spelling the same period differently would read
  // as a different period.
  test('spells a preset the way the time-filter control spells it', () => {
    const preset = timePeriodOptionsConfig.find((option) => option.value === '7d');

    expect(timePeriodLabel('7d', RANGE, false)).toBe(preset?.label);
    expect(timePeriodLabel('7d', RANGE, false)).not.toBe('7d');
  });

  test('every configured preset resolves to its own label', () => {
    timePeriodOptionsConfig.forEach((option) => {
      expect(timePeriodLabel(option.value, RANGE, false)).toBe(option.label);
    });
  });

  // A period id the config does not carry is still named rather than rendering blank.
  test('falls back to the raw id for an unknown preset', () => {
    expect(timePeriodLabel('99y', RANGE, false)).toBe('99y');
  });

  test('names a single-day range with both bounds', () => {
    const sameDay = { startDate: RANGE.startDate, endDate: RANGE.startDate };

    expect(timePeriodLabel('7d', sameDay, true)).toBe(
      `${sameDay.startDate.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' })} - ${sameDay.endDate.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' })}`,
    );
  });

  // The preset id is not cleared when a custom range is applied, so reading it alone would caption a
  // custom range with whichever preset was chosen before it.
  test('names the range itself for a custom period, not the stale preset', () => {
    const label = timePeriodLabel('7d', RANGE, true);

    expect(label).not.toBe('7d');
    expect(label).toContain('-');
    expect(label).toContain(
      RANGE.startDate.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }),
    );
    expect(label).toContain(
      RANGE.endDate.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }),
    );
  });

  test('is pure — same inputs, same label', () => {
    expect(timePeriodLabel('30d', RANGE, true)).toBe(timePeriodLabel('30d', RANGE, true));
  });
});
