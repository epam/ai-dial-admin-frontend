'use client';

import { FC, useMemo } from 'react';

import { DialInput } from '@epam/ai-dial-ui-kit';

import { jsonSchemaToFields } from '@/src/components/Common/SchemaGrid/utils';
import { EntityFieldsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Metric } from '@/src/models/evaluation/metric';
import MetricSchemaSection from './SchemaSection';

interface Props {
  selectedMetric?: Metric;
  selectedMetricDetails?: Metric;
  onChangeName?: (name: string | undefined) => void;
}

const MetricConfiguration: FC<Props> = ({ selectedMetric, selectedMetricDetails, onChangeName }) => {
  const t = useI18n();

  const selectedMetricParameters = useMemo(() => {
    return jsonSchemaToFields(selectedMetricDetails?.configSchema, selectedMetricDetails?.configSchema);
  }, [selectedMetricDetails]);

  const selectedMetricInputs = useMemo(() => {
    return jsonSchemaToFields(selectedMetricDetails?.inputSchema, selectedMetricDetails?.inputSchema);
  }, [selectedMetricDetails]);

  const selectedMetricOutputs = useMemo(() => {
    return jsonSchemaToFields(selectedMetricDetails?.outputSchema, selectedMetricDetails?.outputSchema);
  }, [selectedMetricDetails]);

  return (
    <div className="h-full flex flex-col w-1/2 gap-y-6">
      <div className="flex flex-col">
        <p className="dial-small-semi mb-4">{selectedMetric?.name}</p>
        <span className="dial-tiny-text text-secondary line-clamp-2" title={selectedMetric?.description}>
          {selectedMetric?.description}
        </span>
      </div>

      <DialInput
        labelProps={{ label: t(EntityFieldsI18nKey.displayName), required: true }}
        value={selectedMetric?.name}
        onChange={onChangeName}
      />

      <div className="flex-1 min-h-0 overflow-y-auto gap-y-6">
        <MetricSchemaSection title={t(TestSuitesI18nKey.Configuration)} fields={selectedMetricParameters || []} />
        <MetricSchemaSection title={t(TestSuitesI18nKey.Inputs)} fields={selectedMetricInputs || []} />
        <MetricSchemaSection title={t(TestSuitesI18nKey.Outputs)} fields={selectedMetricOutputs || []} />
      </div>
    </div>
  );
};
export default MetricConfiguration;
