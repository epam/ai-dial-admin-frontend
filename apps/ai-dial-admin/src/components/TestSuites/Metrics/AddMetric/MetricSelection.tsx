'use client';

import { FC, useMemo, useState } from 'react';

import { DialNoDataContent } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import Search from '@/src/components/Common/Search/Search';
import { EntitiesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Metric } from '@/src/models/evaluation/metric';

interface Props {
  selectedMetricId?: string;
  metrics: Metric[];
  onSelectMetric?: (metricId: string) => void;
}

const MetricSelection: FC<Props> = ({ metrics, selectedMetricId, onSelectMetric }) => {
  const t = useI18n();

  const [pattern, setPattern] = useState('');

  const filteredMetrics = useMemo(() => {
    const patternLower = pattern.toLowerCase();
    return metrics?.filter((metric) => metric?.name?.toLowerCase().includes(patternLower)) || [];
  }, [metrics, pattern]);

  return (
    <div className="h-full flex flex-col gap-2">
      <div className="flex flex-row justify-between items-center mb-3">
        <p className="dial-body-semi">{t(TabsI18nKey.Metrics)}</p>

        <Search onChange={(search) => setPattern(search)} />
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        {filteredMetrics.length ? (
          <div className="grid grid-cols-3 gap-4">
            {filteredMetrics.map((metric) => (
              <div
                key={metric.id}
                className={classNames(
                  'px-4 py-3 border border-primary rounded flex flex-col cursor-pointer hover:bg-accent-primary-alpha',
                  metric.id === selectedMetricId && 'bg-accent-primary-alpha border-l-accent-primary border-l-2',
                )}
                onClick={() => onSelectMetric?.(metric.id ?? '')}
              >
                <p className="dial-small-semi mb-4">{metric.name}</p>
                <span className="dial-tiny-text text-secondary line-clamp-2">{metric.description}</span>
              </div>
            ))}
          </div>
        ) : (
          <DialNoDataContent title={t(EntitiesI18nKey.NoMetrics)} />
        )}
      </div>
    </div>
  );
};
export default MetricSelection;
