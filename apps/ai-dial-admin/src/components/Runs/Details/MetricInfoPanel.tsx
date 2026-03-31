'use client';

import { FC, useMemo } from 'react';

import CodeViewer from '@/src/components/Common/CodeViewer/CodeViewer';
import { getInfoEntries, groupInfoEntries } from '@/src/components/TestSuites/utils/metric-info';

interface Props {
  infos: Record<string, unknown>;
  groupTitle: string;
}

const MetricInfoPanel: FC<Props> = ({ infos, groupTitle }) => {
  const entries = useMemo(() => getInfoEntries(infos), [infos]);

  const grouped = useMemo(() => groupInfoEntries(entries), [entries]);

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
