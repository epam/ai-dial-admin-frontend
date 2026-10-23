'use client';

import { Label, SegmentedControl, Select, SegmentedControlItem } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useMemo } from 'react';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
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
  const bindingTypeOptions = useMemo<SegmentedControlItem<FunctionParameterSourceType>[]>(
    () => [
      { value: FunctionParameterSourceType.TestCase, label: t(TestSuitesI18nKey.TestCase) },
      { value: FunctionParameterSourceType.Response, label: t(TestSuitesI18nKey.ResponseColumn) },
      { value: FunctionParameterSourceType.Metric, label: t(TestSuitesI18nKey.Metric) },
    ],
    [t],
  );

  const metricOptions = getMetricOutputOptions(metrics);
  const metricValue = source.metricName ? `${source.metricName}::${source.outputField}` : undefined;
  const selectPlaceholder = t(TestSuitesI18nKey.OverallScoreSelectParameterValue);

  const onTabChange = useCallback(
    (tabId: FunctionParameterSourceType) => {
      onChange({ $type: tabId });
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
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <Label label={t(labelKey)} required />
        <div className="w-fit">
          <SegmentedControl
            aria-label={t(labelKey)}
            items={bindingTypeOptions}
            value={source.$type}
            onChange={onTabChange}
          />
        </div>
      </div>

      {source.$type === FunctionParameterSourceType.TestCase && (
        <Select
          id={elementId}
          ariaLabel={t(labelKey)}
          options={testCaseSchema?.map((item) => ({ label: item.name, value: item.name })) || []}
          value={source.columnName}
          placeholder={selectPlaceholder}
          searchable
          onChange={(v) => onColumnChange(v as string)}
          invalid={!source.columnName}
        />
      )}

      {source.$type === FunctionParameterSourceType.Response && (
        <Select
          id={elementId}
          ariaLabel={t(labelKey)}
          options={responseColumns?.map((item) => ({ label: item.displayName, value: item.name })) || []}
          value={source.columnName}
          placeholder={selectPlaceholder}
          searchable
          onChange={(v) => onColumnChange(v as string)}
          invalid={!source.columnName}
        />
      )}

      {source.$type === FunctionParameterSourceType.Metric && (
        <Select
          id={elementId}
          ariaLabel={t(labelKey)}
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
          placeholder={selectPlaceholder}
          searchable
          onChange={(v) => onMetricChange(v as string)}
          invalid={!metricValue}
        />
      )}
    </div>
  );
};

export default FunctionParameterRow;
