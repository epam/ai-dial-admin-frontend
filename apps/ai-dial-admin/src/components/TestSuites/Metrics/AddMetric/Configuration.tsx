'use client';

import { FC, useCallback } from 'react';

import { Metric } from '@/src/models/evaluation/metric';
import { DialInput } from '@epam/ai-dial-ui-kit';
import { useI18n } from '@/src/locales/client';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';

interface Props {
  selectedMetricDetails?: Metric;
  onChange: (updatedMetric: Metric) => void;
}

const MetricConfiguration: FC<Props> = ({ selectedMetricDetails, onChange }) => {
  const t = useI18n();

  const onChangeName = useCallback(
    (value?: string) => {
      onChange({
        ...selectedMetricDetails,
        name: value,
      } as Metric);
    },
    [onChange, selectedMetricDetails],
  );

  return (
    <div className="h-full flex flex-col w-1/2 gap-y-8">
      <div className="flex flex-col">
        <p className="dial-small-semi mb-4">{selectedMetricDetails?.name}</p>
        <span className="dial-tiny-text text-secondary line-clamp-2" title={selectedMetricDetails?.description}>
          {selectedMetricDetails?.description}
        </span>
      </div>

      <DialInput
        labelProps={{ label: t(EntityFieldsI18nKey.displayName) }}
        value={selectedMetricDetails?.name}
        onChange={onChangeName}
      />

      {/* {selectedMetricDetails && (
        <BindingsConfiguration
          selectedTestSuite={selectedTestSuite}
          selectedMetric={{
            ...selectedMetricDetails,
            name: metricName,
            configBindings,
            inputBindings,
          }}
          onChange={handleBindingsChange}
        />
      )} */}
    </div>
  );
};
export default MetricConfiguration;
