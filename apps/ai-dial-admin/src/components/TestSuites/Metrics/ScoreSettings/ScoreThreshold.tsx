'use client';

import { NumberInput, Switch } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useState } from 'react';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { getOverallScoreThresholdError } from './utils';

interface Props {
  selectedTestSuite: TestSuite;
  onChange: (testSuite: TestSuite) => void;
}

const ScoreThreshold: FC<Props> = ({ selectedTestSuite, onChange }) => {
  const t = useI18n();
  const { resetCounter, dispatch } = useSaveValidationContext();

  const [error, setError] = useState<FieldError | null>(null);
  const isEnabled = selectedTestSuite.overallScoreThreshold !== undefined;

  const clearThreshold = useCallback(() => {
    const { overallScoreThreshold: __, ...rest } = selectedTestSuite;
    setError(null);
    dispatch({ type: ValidationActionType.SetField, field: 'overallScoreThreshold', isValid: true });
    onChange(rest);
  }, [dispatch, onChange, selectedTestSuite]);

  const onEnabledChange = useCallback(
    (enabled: boolean) => {
      if (!enabled) {
        clearThreshold();
        return;
      }

      onChange({ ...selectedTestSuite, overallScoreThreshold: selectedTestSuite.overallScoreThreshold ?? 0.5 });
    },
    [clearThreshold, onChange, selectedTestSuite],
  );

  const onThresholdChange = useCallback(
    (value?: number | string) => {
      if (value === undefined) {
        clearThreshold();
        return;
      }

      const numericValue = Number(value);
      const fieldError = getOverallScoreThresholdError(numericValue, t);
      setError(fieldError);
      dispatch({ type: ValidationActionType.SetField, field: 'overallScoreThreshold', isValid: !fieldError });
      onChange({ ...selectedTestSuite, overallScoreThreshold: numericValue });
    },
    [clearThreshold, dispatch, onChange, selectedTestSuite, t],
  );

  useEffect(() => {
    if (resetCounter || selectedTestSuite.overallScoreThreshold !== undefined) {
      const fieldError = getOverallScoreThresholdError(selectedTestSuite.overallScoreThreshold, t);
      setError(fieldError);
      dispatch({ type: ValidationActionType.SetField, field: 'overallScoreThreshold', isValid: !fieldError });
    }
  }, [dispatch, resetCounter, selectedTestSuite.overallScoreThreshold, t]);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-col gap-2">
        <span className="dial-body-semi-text text-primary">{t(TestSuitesI18nKey.OverallScoreThresholdLabel)}</span>
        <Switch
          id="enableScoreThreshold"
          labelProps={{ label: t(TestSuitesI18nKey.EnableScoreThreshold) }}
          isOn={isEnabled}
          onChange={onEnabledChange}
        />
      </div>

      <div className="flex flex-col gap-1 pl-11">
        <p className="dial-small-text text-secondary">{t(TestSuitesI18nKey.ScoreThresholdDescription)}</p>
        {isEnabled && (
          <div className="flex flex-row items-center gap-3 dial-small-text">
            <span>
              <span className="text-success">{t(TestSuitesI18nKey.ScoreThresholdPass)}</span>
              <span>{` ${t(TestSuitesI18nKey.ScoreThresholdConditionGe)}`}</span>
            </span>
            <NumberInput
              containerClassName="relative max-w-[108px] [&>[role='alert']]:absolute [&>[role='alert']]:top-full [&>[role='alert']]:left-0 [&>[role='alert']]:pt-1 [&>[role='alert']]:whitespace-nowrap"
              id="overallScoreThreshold"
              step={0.01}
              value={selectedTestSuite.overallScoreThreshold}
              invalid={!!error}
              error={error?.text}
              onChange={onThresholdChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ScoreThreshold;
