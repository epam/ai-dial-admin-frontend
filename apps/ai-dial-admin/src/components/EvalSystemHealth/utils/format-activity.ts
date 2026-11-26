import { GROUPING_LOCALE } from '@/src/components/Analytics/Usage/utils/format';

/** A count with thousands grouping (`1284` → `1,284`). */
export const formatCount = (value: number): string => value.toLocaleString(GROUPING_LOCALE);

/** A signed whole-number delta (`+83` / `-12`); `null` when there is no change to show. */
export const formatActivityDelta = (delta: number | null): string | null => {
  if (delta == null || delta === 0) {
    return null;
  }
  const abs = formatCount(Math.abs(delta));
  return delta > 0 ? `+${abs}` : `-${abs}`;
};
