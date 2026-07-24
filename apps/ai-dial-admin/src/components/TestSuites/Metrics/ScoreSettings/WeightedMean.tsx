'use client';

import { DialGhostButton } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import { FC, useCallback, useMemo } from 'react';

import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { Metric } from '@/src/models/evaluation/metric';
import { OverallScoreWeight } from '@/src/models/evaluation/test-suite';
import WeightRow from './WeightRow';
import { getAvailableOptionsForRow, getMetricOutputOptions } from './utils';

interface Props {
  weights: OverallScoreWeight[];
  metrics?: Metric[];
  onChange: (weights: OverallScoreWeight[]) => void;
}

const WeightedMean: FC<Props> = ({ weights, metrics, onChange }) => {
  const t = useI18n();

  const options = useMemo(() => getMetricOutputOptions(metrics), [metrics]);

  const onAdd = useCallback(() => {
    onChange([...weights, { metricName: '', outputField: '', weight: undefined as unknown as number }]);
  }, [onChange, weights]);

  const onUpdateRow = useCallback(
    (row: OverallScoreWeight, index: number) => {
      onChange(weights.map((weight, i) => (i === index ? row : weight)));
    },
    [onChange, weights],
  );

  const onRemoveRow = useCallback(
    (index: number) => {
      const updatedWeights = [...weights];
      updatedWeights.splice(index, 1);
      onChange(updatedWeights);
    },
    [onChange, weights],
  );

  return (
    <div className="mt-4 rounded bg-layer-2 p-4 max-h-80 overflow-y-auto">
      <span className="tiny-semi text-secondary">{t(TestSuitesI18nKey.OverallScoreWeightedMean)}</span>

      {weights.map((weight, index) => (
        <WeightRow
          key={`overallScoreWeight_${index}`}
          index={index}
          row={weight}
          availableOptions={getAvailableOptionsForRow(options, weights, index)}
          onUpdate={onUpdateRow}
          onRemove={onRemoveRow}
        />
      ))}

      <div className="mt-3">
        <DialGhostButton
          label={t(ButtonsI18nKey.Add)}
          iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
          onClick={onAdd}
          disabled={weights.length >= options.length}
        />
      </div>
    </div>
  );
};

export default WeightedMean;
