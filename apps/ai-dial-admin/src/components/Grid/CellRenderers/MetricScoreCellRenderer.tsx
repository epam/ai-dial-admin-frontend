'use client';

import { ICellRendererParams } from 'ag-grid-community';

import ScoreBar from '@/src/components/Common/ScoreBar/ScoreBar';
import { SCORE_INDICATOR_DEFAULT_WIDTH } from '@/src/components/Common/ScoreBar/constants';
import { isScoreIndicatorValue } from '@/src/components/Common/ScoreBar/utils';

const MISSING_DISPLAY = '—';

interface MetricScoreCellRendererParams extends ICellRendererParams {
  getMetricValue?: (params: ICellRendererParams) => unknown;
  width?: number;
}

const MetricScoreCellRenderer = (params: MetricScoreCellRendererParams) => {
  const value = params.getMetricValue ? params.getMetricValue(params) : params.value;
  const width = params.width ?? SCORE_INDICATOR_DEFAULT_WIDTH;

  if (isScoreIndicatorValue(value)) {
    return (
      <div className="flex items-center gap-2 py-1">
        <ScoreBar value={value} width={width} />
        <span className="text-primary dial-small-text shrink-0">{value.toFixed(3)}</span>
      </div>
    );
  }

  const text =
    value == null || value === MISSING_DISPLAY || (typeof value === 'number' && Number.isNaN(value))
      ? MISSING_DISPLAY
      : typeof value === 'string'
        ? value
        : String(value);

  const isMissing = text === MISSING_DISPLAY;

  return <span className={isMissing ? 'text-secondary dial-small-text' : 'text-primary dial-small-text'}>{text}</span>;
};

export default MetricScoreCellRenderer;
