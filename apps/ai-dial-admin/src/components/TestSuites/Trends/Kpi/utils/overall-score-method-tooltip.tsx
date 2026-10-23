import { ReactNode } from 'react';

import {
  FunctionParameterSource,
  FunctionParameterSourceType,
} from '@/src/components/TestSuites/Metrics/ScoreSettings/models';
import {
  getFunctionName,
  getFunctionParameterSources,
  getOverallScoreFormulaLabelKey,
} from '@/src/components/TestSuites/Metrics/ScoreSettings/utils';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { OverallScoreType, TestSuite } from '@/src/models/evaluation/test-suite';

type Translate = (key: string, values?: Record<string, string | number>) => string;

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

export const buildOverallScoreMethodTooltip = (suite: TestSuite, t: Translate, metricCount: number): ReactNode => {
  const methodLabel = t(TestSuitesI18nKey.OverallScoreCalculationMethod);
  const type = suite.overallScore?.type ?? OverallScoreType.Mean;

  if (type === OverallScoreType.Function && suite.overallScore?.type === OverallScoreType.Function) {
    const formulaKey = getOverallScoreFormulaLabelKey(suite);
    const functionLabel = formulaKey ? t(formulaKey) : getFunctionName(suite.overallScore.expression);
    const sources = getFunctionParameterSources(suite.overallScore.expression);
    const datasetSource = sources[0] ?? { $type: FunctionParameterSourceType.TestCase };
    const pSource = sources[1] ?? { $type: FunctionParameterSourceType.TestCase };

    const detailRows = [
      { label: `${t(TestSuitesI18nKey.OverallScoreFunctionLabel)}:`, value: functionLabel },
      { label: `${t(TestSuitesI18nKey.OverallScoreDatasetColumn)}:`, value: sourceTypeLabel(datasetSource, t) },
      { label: `${t(TestSuitesI18nKey.TrendsDatasetValue)}:`, value: sourceValueLabel(datasetSource) },
      { label: `${t(TestSuitesI18nKey.OverallScoreParameterP)}:`, value: sourceTypeLabel(pSource, t) },
      { label: `${t(TestSuitesI18nKey.TrendsPColumnValue)}:`, value: sourceValueLabel(pSource) },
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
    const count = weights.length || metricCount;
    return (
      <div className="flex flex-col gap-0">
        <MethodHeader
          title={`${methodLabel}:`}
          subtitle={t(TestSuitesI18nKey.TrendsWeightedMeanOfNMetrics, { count })}
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

  const count = metricCount > 0 ? metricCount : 0;
  return (
    <div className="flex flex-col gap-0">
      <MethodHeader title={`${methodLabel}:`} subtitle={t(TestSuitesI18nKey.TrendsMeanOfNMetrics, { count })} />
      <span className="tiny">{t(TestSuitesI18nKey.OverallScoreMeanFormula)}</span>
    </div>
  );
};
