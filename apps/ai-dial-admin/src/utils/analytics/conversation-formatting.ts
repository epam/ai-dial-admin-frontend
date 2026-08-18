import {
  COST_COMPACT_THRESHOLD,
  COST_SIGNIFICANT_DIGITS,
  UNAVAILABLE_VALUE,
} from '@/src/constants/analytics/conversations-trace';
import { toBig, toNumber } from '@/src/utils/analytics/scalar';
import { formatNumberWithExponent } from '@/src/utils/formatting/number-formatting';

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

interface Unit {
  limit: number;
  suffix: string;
}

const ELAPSED_UNITS: Unit[] = [
  { limit: DAY_MS, suffix: 'd' },
  { limit: HOUR_MS, suffix: 'h' },
  { limit: MINUTE_MS, suffix: 'm' },
];

const SPAN_UNITS: Unit[] = [
  { limit: DAY_MS, suffix: ' d' },
  { limit: HOUR_MS, suffix: ' h' },
  { limit: MINUTE_MS, suffix: ' min' },
];

const pickUnit = (amount: number, units: Unit[]): Unit | undefined =>
  units.find(({ limit }) => Math.abs(amount) >= limit);

// Only meaningful after a decimal point: on an integer it would turn 20 into 2.
const stripTrailingZeros = (text: string): string =>
  text.includes('.') ? text.replace(/0+$/, '').replace(/\.$/, '') : text;

const ZONELESS_ISO = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;

// The service returns timestamps as ISO-8601 with a `Z`; epoch millis are accepted too, since the
// mapping is not fixed by its contract. A *zoneless* ISO string is the trap: `Date.parse` reads it as
// local time and would shift every cell by the viewer's offset, so it is pinned to UTC first.
export const toMillis = (value: number | string | null): number | null => {
  const parsed = toNumber(value);
  if (parsed !== null) {
    return parsed;
  }
  if (typeof value !== 'string') {
    return null;
  }

  const text = ZONELESS_ISO.test(value.trim()) ? `${value.trim().replace(' ', 'T')}Z` : value;
  const millis = Date.parse(text);
  return Number.isNaN(millis) ? null : millis;
};

export const formatCompactNumber = (value: number | string | null): string => {
  const parsed = toNumber(value);
  return parsed === null ? '' : formatNumberWithExponent(parsed);
};

export const formatSignificantCost = (value: number | string | null): string => {
  const amount = toBig(value);
  if (amount === null) {
    return '';
  }
  if (amount.eq(0)) {
    return '$0';
  }

  // From a dollar up, money reads better rounded and abbreviated than at two significant digits, which
  // would report $19.74 as $20 and switch to exponential notation past two integer digits.
  if (amount.abs().gte(COST_COMPACT_THRESHOLD)) {
    return `$${formatNumberWithExponent(amount.toNumber())}`;
  }

  // Sub-dollar costs need significant digits, not decimal places, to stay legible across three orders of
  // magnitude. Deriving the scale from the exponent rather than calling toPrecision keeps Big from
  // switching to exponential notation below 1e-7.
  const decimals = -amount.e + COST_SIGNIFICANT_DIGITS - 1;
  return `$${stripTrailingZeros(amount.toFixed(decimals))}`;
};

export const formatDurationMs = (value: number | string | null): string => {
  const millis = toNumber(value);
  if (millis === null) {
    return '';
  }
  if (Math.abs(millis) < SECOND_MS) {
    return `${Math.round(millis)}ms`;
  }

  return `${stripTrailingZeros((millis / SECOND_MS).toFixed(1))}s`;
};

export const formatConversationDuration = (value: number | string | null): string => {
  const millis = toNumber(value);
  if (millis === null || millis <= 0) {
    return UNAVAILABLE_VALUE;
  }
  if (millis < MINUTE_MS) {
    return `${stripTrailingZeros((millis / SECOND_MS).toFixed(1))}s`;
  }
  if (millis < HOUR_MS) {
    return `${Math.floor(millis / MINUTE_MS)}m ${Math.round((millis % MINUTE_MS) / SECOND_MS)}s`;
  }

  return `${Math.floor(millis / HOUR_MS)}h ${Math.round((millis % HOUR_MS) / MINUTE_MS)}m`;
};

export const formatRelativeTime = (value: number | string | null, nowMs: number): string => {
  const millis = toMillis(value);
  if (millis === null) {
    return '';
  }

  const elapsed = Math.max(nowMs - millis, 0);
  const unit = pickUnit(elapsed, ELAPSED_UNITS);

  return unit ? `${Math.floor(elapsed / unit.limit)}${unit.suffix} ago` : 'just now';
};

export const formatConversationSpan = (
  firstActivity: number | string | null,
  lastActivity: number | string | null,
): string => {
  const from = toMillis(firstActivity);
  const to = toMillis(lastActivity);
  if (from === null || to === null || to < from) {
    return '';
  }

  const span = to - from;
  const unit = pickUnit(span, SPAN_UNITS);

  return unit ? `${Math.floor(span / unit.limit)}${unit.suffix}` : `${Math.max(Math.round(span / SECOND_MS), 1)} sec`;
};
