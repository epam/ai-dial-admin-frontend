'use client';

import { Tooltip } from '@epam/ai-dial-ui-kit';
import { ICellRendererParams } from 'ag-grid-community';

import { ChevronBadge } from '@/src/components/Common/ChevronBadge/ChevronBadge';
import { OverallScoreThresholdStatus } from '@/src/components/Runs/models';
import { NO_DATA_VALUE } from '@/src/components/Runs/Summary/Cards/constants';
import {
  getOverallScoreThresholdMessage,
  getOverallScoreThresholdStatus,
} from '@/src/components/Runs/utils/test-case-scores';
import { useI18n } from '@/src/locales/client';

interface OverallScoreCellRendererParams extends ICellRendererParams {
  /** The run's snapshotted threshold; no icon and no tooltip without one. */
  threshold?: number | null;
}

const CELL_CLASS_NAME = 'flex size-full items-center justify-end gap-2';

const OverallScoreCellRenderer = ({ value, threshold }: OverallScoreCellRendererParams) => {
  const t = useI18n();
  const score = typeof value === 'number' && Number.isFinite(value) ? value : null;

  if (score == null) {
    return <span className={`${CELL_CLASS_NAME} text-secondary`}>{NO_DATA_VALUE}</span>;
  }

  const status = getOverallScoreThresholdStatus(score, threshold);
  if (threshold == null || status === OverallScoreThresholdStatus.None) {
    return <span className={`${CELL_CLASS_NAME} text-primary`}>{score}</span>;
  }

  const isAbove = status === OverallScoreThresholdStatus.Above;
  const message = getOverallScoreThresholdMessage(t, score, threshold);

  return (
    <Tooltip tooltip={message} asChild>
      <span className={CELL_CLASS_NAME} role="group" aria-label={`${score}. ${message}`}>
        <span className="text-primary" aria-hidden>
          {score}
        </span>
        <ChevronBadge isPositive={isAbove} />
      </span>
    </Tooltip>
  );
};

export default OverallScoreCellRenderer;
