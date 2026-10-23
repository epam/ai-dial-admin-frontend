import { IconArrowDown, IconArrowUp, IconMinus } from '@tabler/icons-react';
import { ICellRendererParams } from 'ag-grid-community';
import classNames from 'classnames';

import { formatHeatMapCellValue } from '@/src/components/Common/HeatMap/utils/format-heat-map-cell-value';
import {
  GroupedAnalyticsResult,
  OverallScoreCellValue,
  TestCaseThresholdStatus,
} from '@/src/components/Runs/ExecutionResults/models';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const OverallScoreCellRenderer = ({ value }: ICellRendererParams<GroupedAnalyticsResult, OverallScoreCellValue>) => {
  const t = useI18n();
  if (value == null) return null;

  const { score, thresholdStatus } = value;
  const displayScore = typeof score === 'number' ? formatHeatMapCellValue(score) : score;
  const isPass = thresholdStatus === TestCaseThresholdStatus.Pass;
  const isFail = thresholdStatus === TestCaseThresholdStatus.Fail;
  const StatusIcon = isPass ? IconArrowUp : isFail ? IconArrowDown : IconMinus;
  const statusLabel = isPass ? t(RunsI18nKey.Above) : isFail ? t(RunsI18nKey.Below) : t(RunsI18nKey.NotApplicable);
  const accessibleLabel = thresholdStatus == null ? displayScore : `${displayScore}, ${statusLabel}`;

  return (
    <span
      className="inline-flex size-full items-center justify-end gap-1 px-3"
      role="group"
      aria-label={accessibleLabel}
    >
      {thresholdStatus != null && (
        <StatusIcon
          className={classNames({
            'text-success': isPass,
            'text-error': isFail,
            'text-secondary': !isPass && !isFail,
          })}
          size={12}
          aria-hidden
        />
      )}
      <span className="text-primary" aria-hidden>
        {displayScore}
      </span>
    </span>
  );
};

export default OverallScoreCellRenderer;
