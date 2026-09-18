import { KpiMetric } from '@/src/components/Analytics/Usage/models';

export enum DeltaTone {
  Good = 'good',
  Bad = 'bad',
  Neutral = 'neutral',
}

/**
 * Which direction is the welcome one for each metric. Spend and latency rising is bad news, errors
 * falling is good news; traffic has a direction only because the design reads growth as progress.
 * A metric absent here is shown without a judgement.
 */
const RISE_IS_GOOD: Partial<Record<KpiMetric, boolean>> = {
  [KpiMetric.TotalSpend]: false,
  [KpiMetric.CostPerMillionTokens]: false,
  [KpiMetric.ErrorRate]: false,
  [KpiMetric.AvgLatency]: false,
  [KpiMetric.Requests]: true,
  [KpiMetric.Tokens]: true,
  [KpiMetric.UniqueUsers]: true,
  [KpiMetric.ToolCalls]: true,
};

export const getDeltaTone = (metric: KpiMetric, deltaRatio: number | null): DeltaTone => {
  const riseIsGood = RISE_IS_GOOD[metric];

  if (deltaRatio == null || deltaRatio === 0 || riseIsGood == null) {
    return DeltaTone.Neutral;
  }

  return deltaRatio > 0 === riseIsGood ? DeltaTone.Good : DeltaTone.Bad;
};

/** Colour never carries the direction alone — the sign stays in the text beside it. */
export const DELTA_TONE_CLASS: Record<DeltaTone, string> = {
  [DeltaTone.Good]: 'text-success',
  [DeltaTone.Bad]: 'text-error',
  [DeltaTone.Neutral]: 'text-primary',
};
