import { Big } from 'big.js';

export const toNumber = (value: number | string | null): number | null => {
  if (value === null || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

// Costs arrive as 12-decimal strings; summing them as floats drifts, so they stay in Big end to end.
// Null means "not a number" — a summary treats that as zero, a cell renders nothing.
export const toBig = (value: number | string | null): Big | null => {
  if (value === null || value === '') {
    return null;
  }
  try {
    return new Big(value);
  } catch {
    return null;
  }
};
