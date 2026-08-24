'use client';

import { DialLabel, DialSelect } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect } from 'react';

import TabSelector from '@/src/components/Common/TabSelector/TabSelector';
import { TabsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { Metric } from '@/src/models/evaluation/metric';
import { ResponseColumn, TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { FunctionParameterSource, FunctionParameterSourceType } from './models';
import { getMetricOutputOptions } from './utils';

export interface Props {
  labelKey: TestSuitesI18nKey;
  source: FunctionParameterSource;
  testCaseSchema?: TestCaseSchema[];
  responseColumns?: ResponseColumn[];
  metrics?: Metric[];
  onChange: (source: FunctionParameterSource) => void;
}

const FunctionParameterRow: FC<Props> = ({ labelKey, source, testCaseSchema, responseColumns, metrics, onChange }) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();

  const elementId = `functionParameter-${labelKey}`;
  const tabs = [
    { label: t(TabsI18nKey.TestCases), id: FunctionParameterSourceType.TestCase },
    { label: t(TestSuitesI18nKey.ResponseColumn), id: FunctionParameterSourceType.Response },
    { label: t(TestSuitesI18nKey.Metric), id: FunctionParameterSourceType.Metric },
  ];

  const metricOptions = getMetricOutputOptions(metrics);
  const metricValue = source.metricName ? `${source.metricName}::${source.outputField}` : undefined;

  const onTabChange = useCallback(
    (tabId: string) => {
      onChange({ $type: tabId as FunctionParameterSourceType });
    },
    [onChange],
  );

  const onColumnChange = useCallback(
    (columnName: string) => {
      onChange({ $type: source.$type, columnName });
    },
    [onChange, source.$type],
  );

  const onMetricChange = useCallback(
    (value: string) => {
      const selected = metricOptions.find((option) => option.value === value);

      if (!selected) {
        return;
      }

      onChange({
        $type: FunctionParameterSourceType.Metric,
        metricName: selected.metricName,
        outputField: selected.outputField,
      });
    },
    [metricOptions, onChange],
  );

  useEffect(() => {
    const isValid = !!(source.metricName || source.columnName);

    dispatch({
      type: ValidationActionType.SetField,
      field: `specific_function_${labelKey}`,
      isValid,
    });

    return () => {
      dispatch({ type: ValidationActionType.RemoveField, field: `specific_function_${labelKey}` });
    };
  }, [dispatch, labelKey, source.columnName, source.metricName]);

  return (
    <div className="flex flex-col gap-1">
      <DialLabel label={t(labelKey)} required />
      <TabSelector tabs={tabs} activeTab={source.$type} onChange={onTabChange} />

      {source.$type === FunctionParameterSourceType.TestCase && (
        <DialSelect
          elementId={elementId}
          options={testCaseSchema?.map((item) => ({ label: item.name, value: item.name })) || []}
          value={source.columnName}
          searchable
          onChange={(v) => onColumnChange(v as string)}
          invalid={!source.columnName}
        />
      )}

      {source.$type === FunctionParameterSourceType.Response && (
        <DialSelect
          elementId={elementId}
          options={responseColumns?.map((item) => ({ label: item.displayName, value: item.name })) || []}
          value={source.columnName}
          searchable
          onChange={(v) => onColumnChange(v as string)}
          invalid={!source.columnName}
        />
      )}

      {source.$type === FunctionParameterSourceType.Metric && (
        <DialSelect
          elementId={elementId}
          options={metricOptions.map((option) => ({
            value: option.value,
            label: option.label,
            labelNode: (
              <>
                <span className="text-secondary">{option.metricName}.</span>
                <span>{option.outputField}</span>
              </>
            ),
          }))}
          value={metricValue}
          searchable
          onChange={(v) => onMetricChange(v as string)}
          invalid={!metricValue}
        />
      )}
    </div>
  );
};

export default FunctionParameterRow;
