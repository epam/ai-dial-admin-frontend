'use client';

import { FC, useState } from 'react';

import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';

import CompareMetricDeltaValue from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/CompareMetricDeltaValue';
import FieldValue from '@/src/components/Runs/Details/RowDetails/FieldValue';
import StatusValue from '@/src/components/Runs/Details/RowDetails/StatusValue';
import {
  ROW_DETAIL_CELL_BASE,
  ROW_DETAIL_FIELD_INDENT,
  ROW_DETAIL_FIELD_SCROLL_MARGIN_TOP,
} from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/constants';
import { RowDetailField } from '@/src/components/Runs/Details/RowDetails/models';
import { getScoreFieldValue } from '@/src/components/Runs/Details/RowDetails/utils/score-field-value';
import { isRightAlignedRowDetailField } from '@/src/components/Runs/Details/RowDetails/utils/row-detail-alignment';
import { getCompareDiffCellProps } from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/utils/row-detail-styles';
import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import { EXECUTION_STATUS_FIELD_KEY } from '@/src/components/Runs/Details/BottomDrawer/constants';
import { CompareRunSlot } from '@/src/components/Runs/Compare/constants';
import { CompareRun } from '@/src/components/Runs/Compare/models';
import { getRowDetailRunValue } from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/utils/run-field-values';
import { mergeClasses } from '@/src/utils/merge-classes';
import { IconMaximize } from '@tabler/icons-react';

interface Props {
  row: RowDetailField;
  hasComparedMatch: boolean;
  noMatchLabel: string;
  failedLabel: string;
  onOpenDiff: (row: RowDetailField) => void;
  openDiffLabel: string;
  hideHighlights: boolean;
  runs: CompareRun[];
}

const diffCellDataAttr = (props: ReturnType<typeof getCompareDiffCellProps>) =>
  props['data-compare-diff'] ? { 'data-compare-diff': props['data-compare-diff'] } : {};

const DetailRow: FC<Props> = ({
  row,
  hasComparedMatch,
  noMatchLabel,
  failedLabel,
  onOpenDiff,
  openDiffLabel,
  hideHighlights,
  runs,
}) => {
  const [overflowBySlot, setOverflowBySlot] = useState<Record<CompareRunSlot, boolean>>({
    [CompareRunSlot.Primary]: false,
    [CompareRunSlot.Secondary]: false,
  });
  const onRunOverflowChange = (slot: CompareRunSlot, isOverflowing: boolean) =>
    setOverflowBySlot((prev) => (prev[slot] === isOverflowing ? prev : { ...prev, [slot]: isOverflowing }));

  const diffKind = hideHighlights ? MetricDeltaKind.Empty : row.diffKind;
  const fieldProps = getCompareDiffCellProps(diffKind, 'field');
  const valueProps = getCompareDiffCellProps(diffKind, 'value');
  const deltaProps = getCompareDiffCellProps(diffKind, 'delta');
  const actionProps = getCompareDiffCellProps(diffKind, 'action');
  const showOpenDiff = Object.values(overflowBySlot).some(Boolean);
  const isStatusRow = row.fieldKey === EXECUTION_STATUS_FIELD_KEY && !row.isMetric;
  const isRightAligned = isRightAlignedRowDetailField(row);

  const renderRunCell = (run: CompareRun) => {
    const { raw, isFailed } = getRowDetailRunValue(row, run.slot);
    const isMissing = run.slot === CompareRunSlot.Secondary && !hasComparedMatch;
    const hasScore = !isMissing && !isStatusRow && getScoreFieldValue(raw, row.isScoreIndicator, isFailed) != null;

    return (
      <div
        key={run.slot}
        className={mergeClasses(
          ROW_DETAIL_CELL_BASE,
          isRightAligned && 'text-right',
          hasScore && 'p-0 flex',
          valueProps.className,
        )}
        {...diffCellDataAttr(valueProps)}
      >
        {isMissing && <span className="text-secondary dial-small-text">{noMatchLabel}</span>}
        {!isMissing && isStatusRow && <StatusValue raw={raw} />}
        {!isMissing && !isStatusRow && (
          <FieldValue
            raw={raw}
            isFailed={isFailed}
            isScoreIndicator={row.isScoreIndicator}
            failedLabel={failedLabel}
            onOverflowChange={(isOverflowing) => onRunOverflowChange(run.slot, isOverflowing)}
          />
        )}
      </div>
    );
  };

  return (
    <div className="contents group">
      <div
        data-field-key={row.fieldKey}
        className={mergeClasses(
          ROW_DETAIL_CELL_BASE,
          ROW_DETAIL_FIELD_INDENT,
          'pr-3 flex items-center',
          fieldProps.className,
        )}
        style={{ scrollMarginTop: ROW_DETAIL_FIELD_SCROLL_MARGIN_TOP }}
        {...diffCellDataAttr(fieldProps)}
      >
        <DialEllipsisTooltip text={row.label} className="dial-small-text text-primary min-w-0" />
      </div>
      {runs.map(renderRunCell)}
      <div
        className={mergeClasses(
          ROW_DETAIL_CELL_BASE,
          row.isNumeric && row.isMetric && 'text-right',
          deltaProps.className,
        )}
        {...diffCellDataAttr(deltaProps)}
      >
        {hasComparedMatch && row.isNumeric && row.isMetric ? (
          <CompareMetricDeltaValue primaryRaw={row.primaryRaw} secondaryRaw={row.secondaryRaw} />
        ) : null}
      </div>
      <div
        className={mergeClasses(
          ROW_DETAIL_CELL_BASE,
          'flex items-center justify-center border-r-0',
          actionProps.className,
        )}
        {...diffCellDataAttr(actionProps)}
      >
        {showOpenDiff ? (
          <button
            type="button"
            onClick={() => onOpenDiff(row)}
            title={openDiffLabel}
            aria-label={openDiffLabel}
            className={mergeClasses(
              'shrink-0 flex items-center justify-center size-[22px] rounded-xs text-secondary hover:text-primary',
              'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity',
            )}
          >
            <IconMaximize size={16} />
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default DetailRow;
