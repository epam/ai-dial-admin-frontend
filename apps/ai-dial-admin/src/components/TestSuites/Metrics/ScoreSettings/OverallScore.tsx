'use client';

import { DialRadioButton } from '@epam/ai-dial-ui-kit';
import { FC, useCallback } from 'react';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Metric } from '@/src/models/evaluation/metric';
import { OverallScoreType, OverallScoreWeight, TestCaseSchema, TestSuite } from '@/src/models/evaluation/test-suite';
import { FunctionParameterSource, FunctionParameterSourceType, OverallScoreFunctionName } from './models';
import SpecificFunction from './SpecificFunction';
import { buildOverallScoreFunctionExpression } from './utils';
import WeightedMean from './WeightedMean';

const DEFAULT_FUNCTION_PARAMETER_SOURCES: FunctionParameterSource[] = [
  { $type: FunctionParameterSourceType.TestCase },
  { $type: FunctionParameterSourceType.Response },
];

interface Props {
  selectedTestSuite: TestSuite;
  metrics?: Metric[];
  testCaseSchema?: TestCaseSchema[];
  onChange: (testSuite: TestSuite) => void;
}

const OverallScore: FC<Props> = ({ selectedTestSuite, metrics, testCaseSchema, onChange }) => {
  const t = useI18n();

  const overallScoreType = selectedTestSuite.overallScore?.type;

  const onSelectMean = useCallback(() => {
    onChange({ ...selectedTestSuite, overallScore: { type: OverallScoreType.Mean } });
  }, [onChange, selectedTestSuite]);

  const onSelectWeightedMean = useCallback(() => {
    if (overallScoreType === OverallScoreType.WeightedMean) {
      return;
    }

    onChange({ ...selectedTestSuite, overallScore: { type: OverallScoreType.WeightedMean, weights: [] } });
  }, [onChange, overallScoreType, selectedTestSuite]);

  const onSelectFunction = useCallback(() => {
    if (overallScoreType === OverallScoreType.Function) {
      return;
    }

    onChange({
      ...selectedTestSuite,
      overallScore: {
        type: OverallScoreType.Function,
        expression: buildOverallScoreFunctionExpression(
          OverallScoreFunctionName.RocAuc,
          DEFAULT_FUNCTION_PARAMETER_SOURCES,
        ),
      },
    });
  }, [onChange, overallScoreType, selectedTestSuite]);

  const onWeightsChange = useCallback(
    (weights: OverallScoreWeight[]) => {
      onChange({ ...selectedTestSuite, overallScore: { type: OverallScoreType.WeightedMean, weights } });
    },
    [onChange, selectedTestSuite],
  );

  const onFunctionChange = useCallback(
    (functionName: OverallScoreFunctionName, parameterSources: FunctionParameterSource[]) => {
      onChange({
        ...selectedTestSuite,
        overallScore: {
          type: OverallScoreType.Function,
          expression: buildOverallScoreFunctionExpression(functionName, parameterSources),
        },
      });
    },
    [onChange, selectedTestSuite],
  );

  return (
    <div className="flex flex-col">
      <span className="body-semi text-primary">{t(TestSuitesI18nKey.OverallScore)}</span>
      <p className="mt-2 small text-secondary">{t(TestSuitesI18nKey.OverallScoreDescription)}</p>

      <div className="mt-4 flex flex-col gap-3">
        <DialRadioButton
          inputId="overallScoreType-mean"
          name="overallScoreType"
          value={OverallScoreType.Mean}
          checked={overallScoreType === OverallScoreType.Mean}
          label={t(TestSuitesI18nKey.OverallScoreMean)}
          caption={t(TestSuitesI18nKey.OverallScoreMeanFormula)}
          oneLineCaption
          onChange={onSelectMean}
        />

        <DialRadioButton
          inputId="overallScoreType-weighted-mean"
          name="overallScoreType"
          value={OverallScoreType.WeightedMean}
          checked={overallScoreType === OverallScoreType.WeightedMean}
          label={t(TestSuitesI18nKey.OverallScoreWeightedMean)}
          caption={t(TestSuitesI18nKey.OverallScoreWeightedMeanFormula)}
          oneLineCaption
          onChange={onSelectWeightedMean}
        />

        <DialRadioButton
          inputId="overallScoreType-function"
          name="overallScoreType"
          value={OverallScoreType.Function}
          checked={overallScoreType === OverallScoreType.Function}
          label={t(TestSuitesI18nKey.OverallScoreFunction)}
          onChange={onSelectFunction}
        />
      </div>

      {selectedTestSuite.overallScore?.type === OverallScoreType.WeightedMean && (
        <WeightedMean weights={selectedTestSuite.overallScore.weights} metrics={metrics} onChange={onWeightsChange} />
      )}

      {selectedTestSuite.overallScore?.type === OverallScoreType.Function && (
        <SpecificFunction
          expression={selectedTestSuite.overallScore.expression}
          testCaseSchema={testCaseSchema}
          responseColumns={selectedTestSuite.responseColumns}
          metrics={metrics}
          onChange={onFunctionChange}
        />
      )}
    </div>
  );
};

export default OverallScore;
