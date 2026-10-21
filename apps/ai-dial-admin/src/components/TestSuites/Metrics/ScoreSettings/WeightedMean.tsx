'use client';

import { DialGhostButton } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import { FC, useCallback, useEffect, useMemo } from 'react';

import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { Metric } from '@/src/models/evaluation/metric';
import { OverallScoreWeight } from '@/src/models/evaluation/test-suite';
import WeightRow from './WeightRow';
import { createNextWeightedMeanWeight, getAvailableOptionsForRow, getMetricOutputOptions } from './utils';

interface Props {
  weights: OverallScoreWeight[];
  metrics?: Metric[];
  onChange: (weights: OverallScoreWeight[]) => void;
}

const WEIGHTED_MEAN_ROWS_FIELD = 'overallScoreWeightsRows';

const WeightedMean: FC<Props> = ({ weights, metrics, onChange }) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();

  const options = useMemo(() => getMetricOutputOptions(metrics), [metrics]);

  const isEmpty = weights.length === 0;
  const canRemoveRow = weights.length > 1;
  const canAddRow = weights.length < options.length;

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: WEIGHTED_MEAN_ROWS_FIELD, isValid: !isEmpty });

    return () => {
      dispatch({ type: ValidationActionType.RemoveField, field: WEIGHTED_MEAN_ROWS_FIELD });
    };
  }, [dispatch, isEmpty]);

  const onAdd = useCallback(() => {
    const nextWeight = createNextWeightedMeanWeight(metrics, weights);
    if (!nextWeight) {
      return;
    }

    onChange([...weights, nextWeight]);
  }, [metrics, onChange, weights]);

  const onUpdateRow = useCallback(
    (row: OverallScoreWeight, index: number) => {
      onChange(weights.map((weight, i) => (i === index ? row : weight)));
    },
    [onChange, weights],
  );

  const onRemoveRow = useCallback(
    (index: number) => {
      if (weights.length <= 1) {
        return;
      }

      const updatedWeights = [...weights];
      updatedWeights.splice(index, 1);
      onChange(updatedWeights);
    },
    [onChange, weights],
  );

  return (
    <div className="mt-4 rounded bg-layer-2 p-4 max-h-80 overflow-y-auto">
      <span className="dial-tiny-semi-text text-secondary">{t(TestSuitesI18nKey.OverallScoreWeightedMean)}</span>

      {isEmpty && <p className="mt-2 dial-tiny-text text-error">{t(TestSuitesI18nKey.OverallScoreAtLeastOneMetric)}</p>}

      {weights.map((weight, index) => (
        <WeightRow
          key={`overallScoreWeight_${index}`}
          index={index}
          row={weight}
          availableOptions={getAvailableOptionsForRow(options, weights, index)}
          disableRemove={!canRemoveRow}
          onUpdate={onUpdateRow}
          onRemove={onRemoveRow}
        />
      ))}

      {canAddRow && (
        <div className="mt-3">
          <DialGhostButton
            label={t(ButtonsI18nKey.Add)}
            iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
            onClick={onAdd}
          />
        </div>
      )}
    </div>
  );
};

export default WeightedMean;
