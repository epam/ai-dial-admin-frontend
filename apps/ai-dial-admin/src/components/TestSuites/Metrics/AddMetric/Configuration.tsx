'use client';

import { FC, useMemo, useState } from 'react';

import { DialInput, DialLinkButton } from '@epam/ai-dial-ui-kit';

import ContentWithLinks from '@/src/components/Common/ContentWithLinks/ContentWithLinks';
import { jsonSchemaToFields } from '@/src/components/Common/SchemaGrid/utils';
import { ButtonsI18nKey, EntityFieldsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Metric, MetricBinding } from '@/src/models/evaluation/metric';
import MetricSchemaSection from './Values/SchemaSection';
import MetricOutputs from './Values/Outputs';
import MetricInputs from './Values/Inputs';
import { TestSuite } from '@/src/models/evaluation/test-suite';

interface Props {
  selectedTestSuite?: TestSuite;
  metricName?: string;
  selectedMetric?: Metric;
  selectedMetricDetails?: Metric;
  inputBindings?: MetricBinding[];
  configBindings?: MetricBinding[];
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
  inputBindings,
  configBindings,
  onChangeName,
  selectedTestSuite,
}) => {
  const t = useI18n();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const description = selectedMetric?.description || selectedMetricDetails?.description || '';
  const isLongDescription = description.length > 150;

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
        <p className="dial-small-semi mb-4">{selectedMetric?.name || selectedMetricDetails?.name}</p>
        <div className="dial-tiny-text text-secondary">
          <div className={!isDescriptionExpanded && isLongDescription ? 'line-clamp-3' : ''}>
            <ContentWithLinks text={description} />
          </div>
          {isLongDescription && (
            <DialLinkButton
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              label={isDescriptionExpanded ? t(ButtonsI18nKey.ShowLess) : t(ButtonsI18nKey.ShowMore)}
            />
          )}
        </div>
      </div>

      <DialInput
        labelProps={{ label: t(EntityFieldsI18nKey.displayName), required: true }}
        value={metricName}
        onChange={onChangeName}
      />

      <div className="flex-1 min-h-0 gap-y-6 flex flex-col">
        <MetricSchemaSection
          title={t(TestSuitesI18nKey.Configuration)}
          fields={selectedMetricParameters || []}
          bindings={configBindings}
          onChange={onChangeConfigBindings}
        />
        <MetricInputs
          title={t(TestSuitesI18nKey.Inputs)}
          bindings={inputBindings}
          fields={selectedMetricInputs || []}
          onChange={onChangeInputBindings}
          selectedTestSuite={selectedTestSuite}
        />
        <MetricOutputs title={t(TestSuitesI18nKey.Outputs)} fields={selectedMetricOutputs || []} />
      </div>
    </div>
  );
};
export default MetricConfiguration;
