'use client';

import { FC, useCallback, useEffect, useState } from 'react';

import { DialNumberInput } from '@epam/ai-dial-ui-kit';

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

  const onThresholdChange = useCallback(
    (value?: number | string) => {
      if (value === undefined) {
        const { overallScoreThreshold: __, ...rest } = selectedTestSuite;
        setError(null);
        dispatch({ type: ValidationActionType.SetField, field: 'overallScoreThreshold', isValid: true });
        onChange(rest);
        return;
      }

      const numericValue = Number(value);
      const fieldError = getOverallScoreThresholdError(numericValue, t);
      setError(fieldError);
      dispatch({ type: ValidationActionType.SetField, field: 'overallScoreThreshold', isValid: !fieldError });
      onChange({ ...selectedTestSuite, overallScoreThreshold: numericValue });
    },
    [dispatch, onChange, selectedTestSuite, t],
  );

  useEffect(() => {
    if (resetCounter || selectedTestSuite.overallScoreThreshold !== undefined) {
      const fieldError = getOverallScoreThresholdError(selectedTestSuite.overallScoreThreshold, t);
      setError(fieldError);
      dispatch({ type: ValidationActionType.SetField, field: 'overallScoreThreshold', isValid: !fieldError });
    }
  }, [dispatch, resetCounter, selectedTestSuite.overallScoreThreshold, t]);

  return (
    <div className="flex flex-col">
      <span className="body-semi text-primary">{t(TestSuitesI18nKey.ScoreThreshold)}</span>
      <p className="mt-2 small text-secondary">{t(TestSuitesI18nKey.ScoreThresholdDescription)}</p>
      <div className="mt-1 flex flex-row items-center gap-2 small">
        <span className="text-success">{t(TestSuitesI18nKey.ScoreThresholdPass)}</span>
        <span>{t(TestSuitesI18nKey.ScoreThresholdCondition)}</span>
        <DialNumberInput
          containerClassName="relative max-w-[120px] [&>[role='alert']]:absolute [&>[role='alert']]:top-full [&>[role='alert']]:left-0 [&>[role='alert']]:pt-1 [&>[role='alert']]:whitespace-nowrap"
          id="overallScoreThreshold"
          step={0.01}
          value={selectedTestSuite.overallScoreThreshold}
          invalid={!!error}
          error={error?.text}
          onChange={onThresholdChange}
        />
        <span>{t(TestSuitesI18nKey.ScoreThresholdOtherwise)}</span>
        <span className="text-error">{t(TestSuitesI18nKey.ScoreThresholdFail)}</span>
      </div>
    </div>
  );
};

export default ScoreThreshold;
