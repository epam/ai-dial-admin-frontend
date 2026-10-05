export enum DurationUnit {
  Milliseconds = 'ms',
  Seconds = 's',
  Minutes = 'm',
  Hours = 'h',
  Days = 'd',
}

export interface ParsedDuration {
  amount: number;
  unit: DurationUnit;
}

const SHORT_FORM = /^(\d+)(ms|s|m|h|d)$/;
const ISO_FORM = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i;

export const parseDuration = (value?: string): ParsedDuration | null => {
  if (!value) {
    return null;
  }

  const short = SHORT_FORM.exec(value.trim());
  if (short) {
    return { amount: Number(short[1]), unit: short[2] as DurationUnit };
  }

  const iso = ISO_FORM.exec(value.trim());
  if (!iso) {
    return null;
  }

  const [, hours, minutes, seconds] = iso;
  const components: ParsedDuration[] = [
    hours && { amount: Number(hours), unit: DurationUnit.Hours },
    minutes && { amount: Number(minutes), unit: DurationUnit.Minutes },
    seconds && { amount: Number(seconds), unit: DurationUnit.Seconds },
  ].filter(Boolean) as ParsedDuration[];

  return components.length === 1 ? components[0] : null;
};

export const formatDuration = ({ amount, unit }: ParsedDuration): string => `${amount}${unit}`;

const UNIT_MS: Record<DurationUnit, number> = {
  [DurationUnit.Milliseconds]: 1,
  [DurationUnit.Seconds]: 1000,
  [DurationUnit.Minutes]: 60_000,
  [DurationUnit.Hours]: 3_600_000,
  [DurationUnit.Days]: 86_400_000,
};

// Everything the services accept, compound ISO included: `parseDuration` returns a single-unit value for an
// editor to show and refuses `PT1H30M`, which the runner still honours.
const ISO_DURATION = /^P(?:(\d+)D)?(?:T(?=\d)(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i;

/** A duration in either accepted spelling as milliseconds, or `undefined` when it is neither. */
export const durationToMs = (value?: string): number | undefined => {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  const short = SHORT_FORM.exec(trimmed);
  if (short) return Number(short[1]) * UNIT_MS[short[2] as DurationUnit];

  const iso = ISO_DURATION.exec(trimmed);
  if (!iso || iso.slice(1).every((part) => part == null)) return undefined;

  const [, days, hours, minutes, seconds] = iso;
  return (
    Number(days ?? 0) * UNIT_MS[DurationUnit.Days] +
    Number(hours ?? 0) * UNIT_MS[DurationUnit.Hours] +
    Number(minutes ?? 0) * UNIT_MS[DurationUnit.Minutes] +
    Number(seconds ?? 0) * UNIT_MS[DurationUnit.Seconds]
  );
};
