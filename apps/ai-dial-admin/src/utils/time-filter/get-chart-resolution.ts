import { TimeRange } from '@/src/models/time-range';

export interface ChartResolution {
  value: number;
  unit: 'm' | 'h' | 'd';
}

export const formatWindow = (resolution: ChartResolution): string =>
  `window(_time, ${resolution.value}, '${resolution.unit}')`;

// Nice bucket sizes in minutes, ascending
const NICE_BUCKETS_MINUTES = [1, 2, 5, 10, 15, 30, 60, 120, 180, 360, 720, 1440];

export const getChartResolution = (timeRange: TimeRange): ChartResolution => {
  const durationMs = timeRange.endDate.getTime() - timeRange.startDate.getTime();
  const durationMinutes = durationMs / (60 * 1000);

  // Pick the smallest nice bucket that keeps data points <= 200
  const minBucket = durationMinutes / 200;

  let selectedMinutes = NICE_BUCKETS_MINUTES[NICE_BUCKETS_MINUTES.length - 1];
  for (const bucket of NICE_BUCKETS_MINUTES) {
    if (bucket >= minBucket) {
      selectedMinutes = bucket;
      break;
    }
  }

  if (selectedMinutes >= 1440 && selectedMinutes % 1440 === 0) {
    return { value: selectedMinutes / 1440, unit: 'd' };
  }
  if (selectedMinutes >= 60 && selectedMinutes % 60 === 0) {
    return { value: selectedMinutes / 60, unit: 'h' };
  }
  return { value: selectedMinutes, unit: 'm' };
};
