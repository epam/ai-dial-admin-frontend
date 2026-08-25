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
