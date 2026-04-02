import { InfoEntry } from '@/src/models/evaluation/detail-panel';
import { beautifyValue } from '@/src/utils/evaluation/detail-panel';

export const getInfoEntries = (infos: Record<string, unknown>): InfoEntry[] => {
  return Object.entries(infos).flatMap(([metricKey, val]) => {
    if (val != null && typeof val === 'object' && !Array.isArray(val)) {
      return Object.entries(val as Record<string, unknown>).map(([subKey, subVal]) => ({
        metricKey,
        entryKey: subKey,
        value: beautifyValue(subVal),
      }));
    }
    return [{ metricKey, entryKey: 'value', value: beautifyValue(val) }];
  });
};

export const groupInfoEntries = (entries: InfoEntry[]): [string, InfoEntry[]][] => {
  const map = new Map<string, InfoEntry[]>();
  for (const entry of entries) {
    const list = map.get(entry.metricKey) ?? [];
    list.push(entry);
    map.set(entry.metricKey, list);
  }
  return Array.from(map.entries());
};
