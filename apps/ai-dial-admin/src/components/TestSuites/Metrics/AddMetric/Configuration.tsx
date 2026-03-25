'use client';

import { FC, useMemo } from 'react';

import { DialInput } from '@epam/ai-dial-ui-kit';

import { jsonSchemaToFields } from '@/src/components/Common/SchemaGrid/utils';
import { EntityFieldsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Metric, MetricBinding } from '@/src/models/evaluation/metric';
import MetricSchemaSection from './SchemaSection';
import { generateMetricDefaultInputBindings } from '../../utils/metric-bindings';

interface Props {
  metricName?: string;
  selectedMetric?: Metric;
  selectedMetricDetails?: Metric;
  onChangeName?: (name: string | undefined) => void;
  onChangeConfigBindings?: (bindings: MetricBinding[]) => void;
  onChangeInputBindings?: (bindings: MetricBinding[]) => void;
}

const MetricConfiguration: FC<Props> = ({
  metricName,
  selectedMetric,
  onChangeConfigBindings,
  onChangeInputBindings,
  selectedMetricDetails,
  onChangeName,
}) => {
  const t = useI18n();

  console.log('selectedMetricDetails', selectedMetricDetails);

  const inputBindings = useMemo(
    () => generateMetricDefaultInputBindings(selectedMetricDetails?.inputSchema ?? {}),
    [selectedMetricDetails?.inputSchema],
  );

  const configBindings = useMemo(
    () => generateMetricDefaultInputBindings(selectedMetricDetails?.configSchema ?? {}),
    [selectedMetricDetails?.configSchema],
  );

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
        value={metricName}
        onChange={onChangeName}
      />

      <div className="flex-1 min-h-0 overflow-y-auto gap-y-6 flex flex-col">
        <MetricSchemaSection
          title={t(TestSuitesI18nKey.Configuration)}
          fields={selectedMetricParameters || []}
          bindings={configBindings}
          onChange={onChangeConfigBindings}
        />
        <MetricSchemaSection
          title={t(TestSuitesI18nKey.Inputs)}
          bindings={inputBindings}
          fields={selectedMetricInputs || []}
          onChange={onChangeInputBindings}
        />
        <MetricSchemaSection title={t(TestSuitesI18nKey.Outputs)} fields={selectedMetricOutputs || []} />
      </div>
    </div>
  );
};
export default MetricConfiguration;
