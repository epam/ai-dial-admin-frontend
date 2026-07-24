'use client';

import { DialNumberInput, DialRemoveButton, DialSelectField } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useState } from 'react';

import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { OverallScoreWeight } from '@/src/models/evaluation/test-suite';
import { MetricOutputOption } from './models';
import { getMetricSelectionError, getWeightError } from './utils';

export interface Props {
  index: number;
  row: OverallScoreWeight;
  availableOptions: MetricOutputOption[];
  onUpdate: (row: OverallScoreWeight, index: number) => void;
  onRemove: (index: number) => void;
}

const WeightRow: FC<Props> = ({ index, row, availableOptions, onUpdate, onRemove }) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();

  const [metricError, setMetricError] = useState<FieldError | null>(null);
  const [weightError, setWeightError] = useState<FieldError | null>(null);

  const metricValue = row.metricName ? `${row.metricName}::${row.outputField}` : '';
  const metricOptions = availableOptions.map((option) => ({
    value: option.value,
    label: option.label,
    labelNode: (
      <>
        <span className="text-secondary">{option.metricName}.</span>
        <span>{option.outputField}</span>
      </>
    ),
  }));

  useEffect(() => {
    const error = getMetricSelectionError(metricValue, t);
    dispatch({ type: ValidationActionType.SetField, field: `overallScoreMetric_${index}`, isValid: !error });

    const currentWeightError = getWeightError(row.weight, t);
    dispatch({
      type: ValidationActionType.SetField,
      field: `overallScoreWeight_${index}`,
      isValid: !currentWeightError,
    });

    return () => {
      dispatch({ type: ValidationActionType.RemoveField, field: `overallScoreMetric_${index}` });
      dispatch({ type: ValidationActionType.RemoveField, field: `overallScoreWeight_${index}` });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resetCounter || metricValue) {
      const error = getMetricSelectionError(metricValue, t);
      setMetricError(error);
      dispatch({ type: ValidationActionType.SetField, field: `overallScoreMetric_${index}`, isValid: !error });
    }
  }, [dispatch, index, metricValue, resetCounter, t]);

  useEffect(() => {
    if (resetCounter || row.weight !== undefined) {
      const error = getWeightError(row.weight, t);
      setWeightError(error);
      dispatch({ type: ValidationActionType.SetField, field: `overallScoreWeight_${index}`, isValid: !error });
    }
  }, [dispatch, index, resetCounter, row.weight, t]);

  const onMetricChange = useCallback(
    (value: string | string[]) => {
      const selected = availableOptions.find((option) => option.value === value);

      if (!selected) {
        return;
      }

      onUpdate({ ...row, metricName: selected.metricName, outputField: selected.outputField }, index);
    },
    [availableOptions, index, onUpdate, row],
  );

  const onWeightChange = useCallback(
    (value?: number | string) => {
      onUpdate({ ...row, weight: value === undefined ? (undefined as unknown as number) : Number(value) }, index);
    },
    [index, onUpdate, row],
  );

  const onRemoveRow = useCallback(() => {
    onRemove(index);
  }, [index, onRemove]);

  return (
    <div className="mt-3 flex flex-row items-end gap-2">
      <div className="min-w-0 flex-1">
        <DialSelectField
          id={`overallScoreMetric_${index}`}
          label={index === 0 ? t(TestSuitesI18nKey.OverallScoreMetricLabel) : undefined}
          value={metricValue}
          options={metricOptions}
          searchable
          invalid={!!metricError}
          onChange={onMetricChange}
        />
      </div>
      <div className="w-[100px]">
        <DialNumberInput
          id={`overallScoreWeight_${index}`}
          labelProps={index === 0 ? { label: t(TestSuitesI18nKey.OverallScoreWeightLabel) } : undefined}
          step={0.01}
          value={row.weight}
          invalid={!!weightError}
          onChange={onWeightChange}
        />
      </div>
      <DialRemoveButton onClick={onRemoveRow} aria-label={t(ButtonsI18nKey.Remove)} />
    </div>
  );
};

export default WeightRow;
