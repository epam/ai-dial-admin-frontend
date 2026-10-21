'use client';

import { DialRadioButton } from '@epam/ai-dial-ui-kit';
import { FC, useCallback } from 'react';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Metric } from '@/src/models/evaluation/metric';
import { OverallScoreType, OverallScoreWeight, TestCaseSchema, TestSuite } from '@/src/models/evaluation/test-suite';
import { getChainResponseColumns } from '@/src/utils/evaluation/request-chain';
import { FunctionParameterSource, FunctionParameterSourceType, OverallScoreFunctionName } from './models';
import SpecificFunction from './SpecificFunction';
import TestCaseOverallScore from './TestCaseOverallScore';
import { buildOverallScoreFunctionExpression, createDefaultWeightedMeanWeights } from './utils';
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

const clearTestCaseOverallScore = (suite: TestSuite): TestSuite => {
  const { testCaseOverallScore: __, ...rest } = suite;
  return rest;
};

const OverallScore: FC<Props> = ({ selectedTestSuite, metrics, testCaseSchema, onChange }) => {
  const t = useI18n();

  const overallScoreType = selectedTestSuite.overallScore?.type;

  const onSelectMean = useCallback(() => {
    onChange(clearTestCaseOverallScore({ ...selectedTestSuite, overallScore: { type: OverallScoreType.Mean } }));
  }, [onChange, selectedTestSuite]);

  const onSelectWeightedMean = useCallback(() => {
    if (overallScoreType === OverallScoreType.WeightedMean) {
      return;
    }

    onChange(
      clearTestCaseOverallScore({
        ...selectedTestSuite,
        overallScore: {
          type: OverallScoreType.WeightedMean,
          weights: createDefaultWeightedMeanWeights(metrics),
        },
      }),
    );
  }, [metrics, onChange, overallScoreType, selectedTestSuite]);

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
      testCaseOverallScore: selectedTestSuite.testCaseOverallScore ?? { type: OverallScoreType.Mean },
    });
  }, [onChange, overallScoreType, selectedTestSuite]);

  const onWeightsChange = useCallback(
    (weights: OverallScoreWeight[]) => {
      onChange(
        clearTestCaseOverallScore({
          ...selectedTestSuite,
          overallScore: { type: OverallScoreType.WeightedMean, weights },
        }),
      );
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
        testCaseOverallScore: selectedTestSuite.testCaseOverallScore ?? { type: OverallScoreType.Mean },
      });
    },
    [onChange, selectedTestSuite],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="body-semi text-primary">{t(TestSuitesI18nKey.OverallScoreCalculationMethod)}</span>
        <p className="small text-secondary">{t(TestSuitesI18nKey.OverallScoreDescription)}</p>
      </div>

      <div className="flex flex-col gap-4">
        <DialRadioButton
          inputId="overallScoreType-mean"
          name="overallScoreType"
          value={OverallScoreType.Mean}
          checked={overallScoreType === OverallScoreType.Mean}
          label={t(TestSuitesI18nKey.OverallScoreMean)}
          caption={t(TestSuitesI18nKey.OverallScoreMeanFormula)}
          onChange={onSelectMean}
        />

        <DialRadioButton
          inputId="overallScoreType-weighted-mean"
          name="overallScoreType"
          value={OverallScoreType.WeightedMean}
          checked={overallScoreType === OverallScoreType.WeightedMean}
          label={t(TestSuitesI18nKey.OverallScoreWeightedMean)}
          caption={t(TestSuitesI18nKey.OverallScoreWeightedMeanFormula)}
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
          responseColumns={getChainResponseColumns(selectedTestSuite)}
          metrics={metrics}
          onChange={onFunctionChange}
          testCaseScoreContent={
            <TestCaseOverallScore selectedTestSuite={selectedTestSuite} metrics={metrics} onChange={onChange} />
          }
        />
      )}
    </div>
  );
};

export default OverallScore;
