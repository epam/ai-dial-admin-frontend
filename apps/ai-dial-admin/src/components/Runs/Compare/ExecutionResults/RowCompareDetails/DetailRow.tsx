'use client';

import { FC, useState } from 'react';

import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';

import CompareMetricDeltaValue from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/CompareMetricDeltaValue';
import FieldValue from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/FieldValue';
import StatusValue from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/StatusValue';
import {
  ROW_DETAIL_CELL_BASE,
  ROW_DETAIL_FIELD_INDENT,
} from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/constants';
import { CompareRowDetailField } from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/models';
import { getCompareDiffCellProps } from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/utils/row-detail-styles';
import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import { EXECUTION_STATUS_FIELD_KEY } from '@/src/components/Runs/Details/BottomDrawer/constants';
import { mergeClasses } from '@/src/utils/merge-classes';
import { IconMaximize } from '@tabler/icons-react';

interface Props {
  row: CompareRowDetailField;
  hasComparedMatch: boolean;
  noMatchLabel: string;
  failedLabel: string;
  onOpenDiff: (row: CompareRowDetailField) => void;
  openDiffLabel: string;
  hideHighlights: boolean;
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
}) => {
  const [primaryOverflow, setPrimaryOverflow] = useState(false);
  const [secondaryOverflow, setSecondaryOverflow] = useState(false);

  const diffKind = hideHighlights ? MetricDeltaKind.Empty : row.diffKind;
  const fieldProps = getCompareDiffCellProps(diffKind, 'field');
  const valueProps = getCompareDiffCellProps(diffKind, 'value');
  const deltaProps = getCompareDiffCellProps(diffKind, 'delta');
  const actionProps = getCompareDiffCellProps(diffKind, 'action');
  const showOpenDiff = primaryOverflow || secondaryOverflow;
  const isStatusRow = row.fieldKey === EXECUTION_STATUS_FIELD_KEY && !row.isMetric;

  return (
    <div className="contents group">
      <div
        className={mergeClasses(
          ROW_DETAIL_CELL_BASE,
          ROW_DETAIL_FIELD_INDENT,
          'pr-3 flex items-center',
          fieldProps.className,
        )}
        {...diffCellDataAttr(fieldProps)}
      >
        <DialEllipsisTooltip text={row.label} className="dial-small-text text-primary min-w-0" />
      </div>
      <div className={mergeClasses(ROW_DETAIL_CELL_BASE, valueProps.className)} {...diffCellDataAttr(valueProps)}>
        {isStatusRow ? (
          <StatusValue raw={row.primaryRaw} />
        ) : (
          <FieldValue
            raw={row.primaryRaw}
            isFailed={row.primaryFailed}
            isScoreIndicator={row.isScoreIndicator}
            failedLabel={failedLabel}
            onOverflowChange={setPrimaryOverflow}
          />
        )}
      </div>
      <div className={mergeClasses(ROW_DETAIL_CELL_BASE, valueProps.className)} {...diffCellDataAttr(valueProps)}>
        {hasComparedMatch ? (
          isStatusRow ? (
            <StatusValue raw={row.secondaryRaw} />
          ) : (
            <FieldValue
              raw={row.secondaryRaw}
              isFailed={row.secondaryFailed}
              isScoreIndicator={row.isScoreIndicator}
              failedLabel={failedLabel}
              onOverflowChange={setSecondaryOverflow}
            />
          )
        ) : (
          <span className="text-secondary dial-small-text">{noMatchLabel}</span>
        )}
      </div>
      <div className={mergeClasses(ROW_DETAIL_CELL_BASE, deltaProps.className)} {...diffCellDataAttr(deltaProps)}>
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
              'shrink-0 flex items-center justify-center size-[22px] rounded-sm text-secondary hover:text-primary',
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
