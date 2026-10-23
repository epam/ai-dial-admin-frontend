import { stripTrailingZeros } from '@/src/utils/formatting/number-formatting';

const RUN_COST_SIGNIFICANT_DIGITS = 2;

export const formatRunCostValue = (value: number | null | undefined): string | null => {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }

  if (value === 0) {
    return '$0';
  }

  const abs = Math.abs(value);

  if (abs >= 1) {
    return `$${stripTrailingZeros(value.toFixed(2))}`;
  }

  const exponent = Math.floor(Math.log10(abs));
  const significantDecimals = -exponent + RUN_COST_SIGNIFICANT_DIGITS - 1;

  // Preserve at least 4 decimal places for chart values.
  const decimals = Math.max(4, significantDecimals);

  return `$${stripTrailingZeros(value.toFixed(decimals))}`;
};
