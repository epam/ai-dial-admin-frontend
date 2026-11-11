import { ReactNode } from 'react';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { OverallScoreConfig, OverallScoreType, TestSuite } from '@/src/models/evaluation/test-suite';

import { FunctionParameterSource, FunctionParameterSourceType } from './models';
import { getFunctionName, getFunctionParameterSources, getOverallScoreFormulaLabelKey } from './utils';

type Translate = (key: string, values?: Record<string, string | number>) => string;

/** Short name of an overall-score method: "Mean of N metrics", "Weighted mean of N metrics" or "Specific function". */
export const getOverallScoreMethodName = (
  overallScore: OverallScoreConfig,
  t: Translate,
  metricCount: number,
): string => {
  switch (overallScore.type) {
    case OverallScoreType.Function:
      return t(TestSuitesI18nKey.OverallScoreFunction);
    case OverallScoreType.WeightedMean:
      return t(TestSuitesI18nKey.TrendsWeightedMeanOfNMetrics, { count: overallScore.weights.length || metricCount });
    case OverallScoreType.Mean:
    default:
      return t(TestSuitesI18nKey.TrendsMeanOfNMetrics, { count: metricCount });
  }
};

const sourceTypeLabel = (source: FunctionParameterSource, t: Translate): string => {
  switch (source.$type) {
    case FunctionParameterSourceType.Response:
      return t(TestSuitesI18nKey.ResponseColumn).toLowerCase();
    case FunctionParameterSourceType.Metric:
      return [source.metricName, source.outputField].filter(Boolean).join(' · ') || t(TestSuitesI18nKey.Metric);
    case FunctionParameterSourceType.TestCase:
    default:
      return t(TestSuitesI18nKey.TestCase);
  }
};

const sourceValueLabel = (source: FunctionParameterSource): string => {
  if (source.$type === FunctionParameterSourceType.Metric) {
    return source.outputField || source.metricName || '—';
  }
  return source.columnName || '—';
};

const MethodHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="flex flex-col gap-0">
    <span className="tiny">{title}</span>
    <span className="tiny font-bold">{subtitle}</span>
  </div>
);

/**
 * Tooltip body describing how an overall score is calculated. Only the overall-score method is read, so a run's
 * snapshot works as well as a live suite.
 */
export const buildOverallScoreMethodTooltip = (
  suite: Pick<TestSuite, 'overallScore'>,
  t: Translate,
  metricCount: number,
): ReactNode => {
  const methodLabel = t(TestSuitesI18nKey.OverallScoreCalculationMethod);
  const type = suite.overallScore?.type ?? OverallScoreType.Mean;

  if (type === OverallScoreType.Function && suite.overallScore?.type === OverallScoreType.Function) {
    const formulaKey = getOverallScoreFormulaLabelKey(suite);
    const functionLabel = formulaKey ? t(formulaKey) : getFunctionName(suite.overallScore.expression);
    const sources = getFunctionParameterSources(suite.overallScore.expression);
    const groundTruthSource = sources[0] ?? { $type: FunctionParameterSourceType.TestCase };
    const predictionSource = sources[1] ?? { $type: FunctionParameterSourceType.TestCase };

    const detailRows = [
      { label: `${t(TestSuitesI18nKey.OverallScoreFunctionLabel)}:`, value: functionLabel },
      { label: `${t(TestSuitesI18nKey.OverallScoreGroundTruth)}:`, value: sourceTypeLabel(groundTruthSource, t) },
      { label: `${t(TestSuitesI18nKey.TrendsGroundTruthValue)}:`, value: sourceValueLabel(groundTruthSource) },
      { label: `${t(TestSuitesI18nKey.OverallScorePrediction)}:`, value: sourceTypeLabel(predictionSource, t) },
      { label: `${t(TestSuitesI18nKey.TrendsPredictionValue)}:`, value: sourceValueLabel(predictionSource) },
    ];

    return (
      <div className="flex flex-col gap-1">
        <MethodHeader
          title={`${methodLabel}:`}
          subtitle={`${t(TestSuitesI18nKey.OverallScoreFunction)} · ${functionLabel}`}
        />
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            {detailRows.map((row) => (
              <span key={row.label} className="tiny">
                {row.label}
              </span>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            {detailRows.map((row) => (
              <span key={`v-${row.label}`} className="tiny">
                {row.value}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === OverallScoreType.WeightedMean && suite.overallScore?.type === OverallScoreType.WeightedMean) {
    const weights = suite.overallScore.weights;
    return (
      <div className="flex flex-col gap-0">
        <MethodHeader
          title={`${methodLabel}:`}
          subtitle={getOverallScoreMethodName(suite.overallScore, t, metricCount)}
        />
        {weights.map((weight) => (
          <span key={`${weight.metricName}-${weight.outputField}`} className="tiny">
            {weight.metricName}
            {weight.outputField ? `.${weight.outputField}` : ''} × {weight.weight}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      <MethodHeader
        title={`${methodLabel}:`}
        subtitle={getOverallScoreMethodName({ type: OverallScoreType.Mean }, t, metricCount)}
      />
      <span className="tiny">{t(TestSuitesI18nKey.OverallScoreMeanFormula)}</span>
    </div>
  );
};
