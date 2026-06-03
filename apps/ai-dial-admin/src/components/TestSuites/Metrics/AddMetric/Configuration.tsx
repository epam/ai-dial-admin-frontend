'use client';

import { Dispatch, FC, SetStateAction, useCallback, useMemo, useState } from 'react';

import { DialInput, DialSelect, SelectOption, SelectSize, SelectVariant } from '@epam/ai-dial-ui-kit';
import classnames from 'classnames';

import ContentWithLinks from '@/src/components/Common/ContentWithLinks/ContentWithLinks';
import ExpandableText from '@/src/components/Common/ExpandableText/ExpandableText';
import { jsonSchemaToFields } from '@/src/components/Common/SchemaGrid/utils';
import JsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { CompareI18nKey, EntityFieldsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Metric, MetricBinding } from '@/src/models/evaluation/metric';
import { TestCaseSchema, TestSuite } from '@/src/models/evaluation/test-suite';
import MetricInputs from './Values/Inputs';
import MetricOutputs from './Values/Outputs';
import MetricSchemaSection from './Values/SchemaSection';

interface Props {
  selectedTestSuite?: TestSuite;
  testCaseSchema?: TestCaseSchema[];
  metricName?: string;
  selectedMetric?: Metric;
  selectedMetricDetails?: Metric;
  inputBindings?: MetricBinding[];
  configBindings?: MetricBinding[];
  onChangeName?: (name: string | undefined) => void;
  onChangeConfigBindings?: (bindings: MetricBinding[]) => void;
  onChangeInputBindings?: (bindings: MetricBinding[]) => void;
  onJsonViewChange?: (isJsonView: boolean) => void;
}

interface MetricConfigurationData {
  name?: string;
  configBindings?: MetricBinding[];
  inputBindings?: MetricBinding[];
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
  testCaseSchema,
  onJsonViewChange,
}) => {
  const t = useI18n();
  const [isJsonView, setIsJsonView] = useState(false);

  const metricNameError = metricName?.includes(':') ? t(TestSuitesI18nKey.MetricNameInvalidChars) : undefined;

  const description = selectedMetric?.description || selectedMetricDetails?.description || '';

  const viewOptions: SelectOption[] = [
    { value: 'controls', label: t(TestSuitesI18nKey.Controls) },
    { value: 'json', label: 'JSON' },
  ];

  const onViewSelectChange = useCallback(
    (value: string | string[]) => {
      const v = Array.isArray(value) ? value[0] : value;
      const jsonView = v === 'json';
      setIsJsonView(jsonView);
      onJsonViewChange?.(jsonView);
    },
    [onJsonViewChange],
  );

  const metricConfigData: MetricConfigurationData = useMemo(
    () => ({
      name: metricName,
      configBindings,
      inputBindings,
    }),
    [metricName, configBindings, inputBindings],
  );

  const onChangeMetricConfigData = useCallback(
    (data: MetricConfigurationData) => {
      if (data.name != null && onChangeName) {
        onChangeName(data.name);
      }
      if (data.configBindings && onChangeConfigBindings) {
        onChangeConfigBindings(data.configBindings);
      }
      if (data.inputBindings && onChangeInputBindings) {
        onChangeInputBindings(data.inputBindings);
      }
    },
    [onChangeName, onChangeConfigBindings, onChangeInputBindings],
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
    <div className={classnames('h-full flex flex-col gap-y-6', isJsonView ? 'w-full' : 'w-1/2')}>
      <div className="flex flex-col">
        <div className="flex flex-row justify-between items-start mb-4">
          <p className="dial-small-semi">{selectedMetric?.displayName || selectedMetricDetails?.displayName}</p>
          <DialSelect
            prefix={`${t(CompareI18nKey.View)}: `}
            size={SelectSize.Sm}
            variant={SelectVariant.Secondary}
            options={viewOptions}
            value={isJsonView ? 'json' : 'controls'}
            onChange={onViewSelectChange}
          />
        </div>
        <ExpandableText
          lines={3}
          className={classnames('h-full dial-tiny-text text-secondary', !isJsonView ? 'w-full' : 'w-1/2')}
        >
          <ContentWithLinks text={description} />
        </ExpandableText>
      </div>

      {isJsonView ? (
        <div className="flex-1 min-h-0">
          <JsonEditor
            entity={metricConfigData as object}
            options={{ stickyScroll: { enabled: false } }}
            setSelectedEntity={onChangeMetricConfigData as Dispatch<SetStateAction<MetricConfigurationData>>}
          />
        </div>
      ) : (
        <>
          <DialInput
            labelProps={{ label: t(EntityFieldsI18nKey.name), required: true }}
            value={metricName}
            error={metricNameError}
            invalid={!!metricNameError}
            onChange={onChangeName}
          />

          <div className="flex-1 min-h-0 gap-y-6 flex flex-col">
            <div className="flex flex-col gap-y-4 border border-primary rounded p-4">
              <MetricSchemaSection
                title={t(TestSuitesI18nKey.Configuration)}
                fields={selectedMetricParameters || []}
                bindings={configBindings}
                schema={selectedMetricDetails?.configSchema}
                onChange={onChangeConfigBindings}
              />
            </div>

            <div className="flex flex-col gap-y-4 border border-primary rounded p-4">
              <MetricInputs
                title={t(TestSuitesI18nKey.Inputs)}
                bindings={inputBindings}
                fields={selectedMetricInputs || []}
                schema={selectedMetricDetails?.inputSchema}
                onChange={onChangeInputBindings}
                selectedTestSuite={selectedTestSuite}
                testCaseSchema={testCaseSchema}
              />
            </div>

            <div className="flex flex-col gap-y-4 border border-primary rounded p-4">
              <MetricOutputs title={t(TestSuitesI18nKey.Outputs)} fields={selectedMetricOutputs || []} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
export default MetricConfiguration;
