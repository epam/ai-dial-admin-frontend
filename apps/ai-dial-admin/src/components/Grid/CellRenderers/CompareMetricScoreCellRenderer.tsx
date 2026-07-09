'use client';

import { ICellRendererParams } from 'ag-grid-community';

import ScoreBar from '@/src/components/Common/ScoreBar/ScoreBar';
import { SCORE_INDICATOR_COMPARE_WIDTH } from '@/src/components/Common/ScoreBar/constants';
import { isScoreIndicatorValue } from '@/src/components/Common/ScoreBar/utils';
import { COMPARE_MISSING_DISPLAY } from '@/src/components/Runs/Compare/ExecutionResults/constants';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';

interface CompareMetricScoreCellRendererParams extends ICellRendererParams {
  errorText?: string;
  getMetricValue: (params: { data?: CompareAnalyticsRow }) => unknown;
}

const CompareMetricScoreCellRenderer = (params: CompareMetricScoreCellRendererParams) => {
  const value = params.getMetricValue(params);

  if (isScoreIndicatorValue(value)) {
    return (
      <div className="flex items-center gap-2 py-1">
        <ScoreBar value={value} width={SCORE_INDICATOR_COMPARE_WIDTH} />
        <span className="text-primary dial-small-text shrink-0">{value.toFixed(3)}</span>
      </div>
    );
  }

  const text =
    value == null || value === COMPARE_MISSING_DISPLAY || (typeof value === 'number' && Number.isNaN(value))
      ? COMPARE_MISSING_DISPLAY
      : typeof value === 'string'
        ? value
        : String(value);

  const isMissing = text === COMPARE_MISSING_DISPLAY;

  return <span className={isMissing ? 'text-secondary dial-small-text' : 'text-primary dial-small-text'}>{text}</span>;
};

export default CompareMetricScoreCellRenderer;
