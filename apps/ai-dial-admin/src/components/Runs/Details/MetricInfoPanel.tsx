'use client';

import { FC, useMemo } from 'react';

import CodeViewer from '@/src/components/Common/CodeViewer/CodeViewer';
import { getInfoEntries, groupInfoEntries } from '@/src/components/TestSuites/utils/metric-info';

interface Props {
  info: Record<string, unknown>;
}

const MetricInfoPanel: FC<Props> = ({ info }) => {
  const entries = useMemo(() => getInfoEntries(info), [info]);

  const grouped = useMemo(() => groupInfoEntries(entries), [entries]);

  return (
    <div className="flex flex-col gap-3 max-h-[400px] overflow-auto p-2 bg-layer-0 border border-secondary rounded">
      {grouped.map(([metricKey, metricEntries]) => (
        <div key={metricKey} className="flex flex-col gap-3">
          <div className="text-xxs font-semibold text-accent-secondary uppercase tracking-wide">{metricKey}</div>
          {metricEntries.map((entry) => (
            <CodeViewer key={`${entry.metricKey}-${entry.entryKey}`} title={entry.entryKey} content={entry.value} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default MetricInfoPanel;
