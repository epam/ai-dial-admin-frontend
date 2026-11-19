/**
 * Next integer for a stepper: empty/invalid → `min`; otherwise floor + 1, capped by optional `max`.
 */
export const stepUp = (current: string | number | undefined, min: number, max?: number): number => {
  const n = Number(current);
  const next = Number.isFinite(n) && n >= min ? Math.floor(n) + 1 : min;
  return max != null && next > max ? max : next;
};

/**
 * Previous integer for a stepper: empty/invalid → `min`; otherwise ceil − 1, floored at `min`.
 */
export const stepDown = (current: string | number | undefined, min: number): number => {
  const n = Number(current);
  return Number.isFinite(n) && n > min ? Math.ceil(n) - 1 : min;
};
