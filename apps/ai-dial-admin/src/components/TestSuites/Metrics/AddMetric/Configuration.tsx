'use client';

import { Dispatch, FC, SetStateAction, useCallback, useMemo, useState } from 'react';

import { Input, Switch } from '@epam/ai-dial-ui-kit';

import ContentWithLinks from '@/src/components/Common/ContentWithLinks/ContentWithLinks';
import { jsonSchemaToFields } from '@/src/components/Common/SchemaGrid/utils';
import JsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { CSV_COLUMN_SEPARATOR } from '@/src/constants/eval-export';
import { EntityFieldsI18nKey, TabsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AttributeSamples } from '@/src/models/evaluation/attribute-samples';
import { Metric, MetricBinding } from '@/src/models/evaluation/metric';
import { TestCaseSchema, TestSuite } from '@/src/models/evaluation/test-suite';
import { CONDITION_MAX_LENGTH } from './constants';
import MetricInputs from './Values/Inputs';
import MetricOutputs from './Values/Outputs';
import MetricSchemaSection from './Values/SchemaSection';

interface Props {
  selectedTestSuite?: TestSuite;
  testCaseSchema?: TestCaseSchema[];
  samples?: AttributeSamples;
  metricName?: string;
  selectedMetric?: Metric;
  selectedMetricDetails?: Metric;
  inputBindings?: MetricBinding[];
  configBindings?: MetricBinding[];
  condition?: string;
  conditionError?: string;
  onChangeName?: (name: string | undefined) => void;
  onChangeConfigBindings?: (bindings: MetricBinding[]) => void;
  onChangeInputBindings?: (bindings: MetricBinding[]) => void;
  onJsonViewChange?: (isJsonView: boolean) => void;
  onChangeCondition?: (condition: string) => void;
}

interface MetricConfigurationData {
  name?: string;
  condition?: string;
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
  condition,
  conditionError,
  onChangeName,
  selectedTestSuite,
  testCaseSchema,
  samples,
  onJsonViewChange,
  onChangeCondition,
}) => {
  const t = useI18n();
  const [isJsonView, setIsJsonView] = useState(false);

  const metricNameError = metricName?.includes(CSV_COLUMN_SEPARATOR)
    ? t(TestSuitesI18nKey.MetricNameInvalidChars)
    : undefined;

  const description = selectedMetric?.description || selectedMetricDetails?.description || '';
  const displayName = selectedMetric?.displayName || selectedMetricDetails?.displayName;

  const onJsonModeChange = useCallback(
    (jsonView: boolean) => {
      setIsJsonView(jsonView);
      onJsonViewChange?.(jsonView);
    },
    [onJsonViewChange],
  );

  const metricConfigData: MetricConfigurationData = useMemo(
    () => ({
      name: metricName,
      condition,
      configBindings,
      inputBindings,
    }),
    [metricName, condition, configBindings, inputBindings],
  );

  const onChangeMetricConfigData = useCallback(
    (data: MetricConfigurationData) => {
      if (data.name != null && onChangeName) {
        onChangeName(data.name);
      }
      if (data.condition != null && onChangeCondition) {
        onChangeCondition(data.condition);
      }
      if (data.configBindings && onChangeConfigBindings) {
        onChangeConfigBindings(data.configBindings);
      }
      if (data.inputBindings && onChangeInputBindings) {
        onChangeInputBindings(data.inputBindings);
      }
    },
    [onChangeName, onChangeCondition, onChangeConfigBindings, onChangeInputBindings],
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
    <div className="h-full flex gap-8 min-h-0">
      <div className="w-[400px] shrink-0 flex flex-col gap-3 overflow-auto">
        <div className="bg-layer-4 rounded p-3 flex flex-col gap-2 min-w-0 overflow-hidden">
          <div className="flex flex-col gap-1 min-w-0">
            <p className="dial-tiny-text text-secondary">{t(TestSuitesI18nKey.Metric)}</p>
            <p className="text-base font-semibold text-primary leading-6 break-words">{displayName}</p>
          </div>
          {description ? (
            <p className="dial-tiny-text text-secondary min-w-0 break-words [overflow-wrap:anywhere]">
              <ContentWithLinks text={description} />
            </p>
          ) : null}
        </div>

        {(selectedMetricOutputs?.length ?? 0) > 0 ? (
          <div className="bg-layer-4 rounded p-3">
            <MetricOutputs title={t(TestSuitesI18nKey.Outputs)} fields={selectedMetricOutputs || []} />
          </div>
        ) : null}
      </div>

      <div className="flex-1 min-w-0 min-h-0 flex flex-col gap-3">
        <div className="flex flex-row items-center justify-between shrink-0">
          <p className="dial-tiny-text text-secondary">{t(TestSuitesI18nKey.SetUpMetric)}</p>
          <Switch
            id="metric-json-mode"
            labelProps={{ label: t(TestSuitesI18nKey.JsonMode) }}
            isOn={isJsonView}
            onChange={onJsonModeChange}
          />
        </div>

        {isJsonView ? (
          <div className="flex-1 min-h-0">
            <JsonEditor
              entity={metricConfigData as object}
              setSelectedEntity={onChangeMetricConfigData as Dispatch<SetStateAction<MetricConfigurationData>>}
            />
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-auto flex flex-col gap-5">
            <div className="flex flex-col gap-4">
              <p className="dial-small-semi text-primary">{t(TabsI18nKey.Properties)}</p>
              <Input
                labelProps={{ label: t(EntityFieldsI18nKey.displayName), required: true }}
                value={metricName}
                error={metricNameError}
                invalid={!!metricNameError}
                onChange={onChangeName}
              />
              <Input
                labelProps={{ label: t(TestSuitesI18nKey.Condition) }}
                caption={t(TestSuitesI18nKey.ConditionHint)}
                placeholder="$exists(response.answer)"
                maxLength={CONDITION_MAX_LENGTH}
                value={condition ?? ''}
                error={conditionError}
                invalid={!!conditionError}
                onChange={(value) => onChangeCondition?.(value ?? '')}
              />
            </div>

            <div className="border-b border-secondary" />

            <MetricSchemaSection
              title={t(TestSuitesI18nKey.Configuration)}
              fields={selectedMetricParameters || []}
              bindings={configBindings}
              schema={selectedMetricDetails?.configSchema}
              onChange={onChangeConfigBindings}
            />

            <div className="border-b border-secondary" />

            <MetricInputs
              title={t(TestSuitesI18nKey.Inputs)}
              bindings={inputBindings}
              fields={selectedMetricInputs || []}
              schema={selectedMetricDetails?.inputSchema}
              onChange={onChangeInputBindings}
              selectedTestSuite={selectedTestSuite}
              testCaseSchema={testCaseSchema}
              samples={samples}
            />
          </div>
        )}
      </div>
    </div>
  );
};
export default MetricConfiguration;
