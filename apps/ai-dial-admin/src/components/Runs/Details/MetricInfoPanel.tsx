'use client';

import { FC, useMemo } from 'react';

import CodeViewer from './CodeViewer';

interface Props {
  infos: Record<string, unknown>;
  groupTitle: string;
}

const beautifyValue = (val: unknown): string => {
  if (val == null) return String(val);
  if (typeof val === 'object') return JSON.stringify(val, null, 2);
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (typeof parsed === 'object') return JSON.stringify(parsed, null, 2);
    } catch {
      // not JSON
    }
    return val;
  }
  return String(val);
};

interface InfoEntry {
  metricKey: string;
  entryKey: string;
  value: string;
}

const MetricInfoPanel: FC<Props> = ({ infos, groupTitle }) => {
  const entries = useMemo((): InfoEntry[] => {
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
  }, [infos]);

  // Group entries by metricKey for section headers
  const grouped = useMemo(() => {
    const map = new Map<string, InfoEntry[]>();
    for (const entry of entries) {
      const list = map.get(entry.metricKey) ?? [];
      list.push(entry);
      map.set(entry.metricKey, list);
    }
    return Array.from(map.entries());
  }, [entries]);

  return (
    <div className="mt-1.5 flex flex-col gap-3 max-h-[400px] overflow-auto p-2 bg-layer-0 border border-secondary rounded">
      {grouped.map(([metricKey, metricEntries]) => (
        <div key={metricKey} className="flex flex-col gap-1.5">
          <div className="text-[10px] font-semibold text-accent-secondary uppercase tracking-wide">{metricKey}</div>
          {metricEntries.map((entry) => (
            <CodeViewer key={`${entry.metricKey}-${entry.entryKey}`} title={entry.entryKey} content={entry.value} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default MetricInfoPanel;
