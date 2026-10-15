'use client';

import { FC, useState } from 'react';

import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';
import { IconMaximize } from '@tabler/icons-react';

import {
  ROW_DETAIL_CELL_BASE,
  ROW_DETAIL_FIELD_INDENT,
  ROW_DETAIL_FIELD_SCROLL_MARGIN_TOP,
} from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/constants';
import { EXECUTION_STATUS_FIELD_KEY } from '@/src/components/Runs/Details/BottomDrawer/constants';
import FieldValue from '@/src/components/Runs/Details/RowDetails/FieldValue';
import { RowDetailField } from '@/src/components/Runs/Details/RowDetails/models';
import StatusValue from '@/src/components/Runs/Details/RowDetails/StatusValue';
import { isRightAlignedRowDetailField } from '@/src/components/Runs/Details/RowDetails/utils/row-detail-alignment';
import { getScoreFieldValue } from '@/src/components/Runs/Details/RowDetails/utils/score-field-value';
import { mergeClasses } from '@/src/utils/merge-classes';

interface Props {
  row: RowDetailField;
  failedLabel: string;
  openFullValueLabel: string;
  onOpenFullValue: (row: RowDetailField) => void;
}

const ExecutionRowDetailRow: FC<Props> = ({ row, failedLabel, openFullValueLabel, onOpenFullValue }) => {
  const [isOverflowing, setIsOverflowing] = useState(false);

  const raw = row.primaryRaw;
  const isFailed = row.primaryFailed ?? false;
  const isStatusRow = row.fieldKey === EXECUTION_STATUS_FIELD_KEY && !row.isMetric;
  const hasScore = !isStatusRow && getScoreFieldValue(raw, row.isScoreIndicator, isFailed) != null;

  return (
    <div className="contents group">
      <div
        data-field-key={row.fieldKey}
        className={mergeClasses(ROW_DETAIL_CELL_BASE, ROW_DETAIL_FIELD_INDENT, 'pr-3 flex items-center')}
        style={{ scrollMarginTop: ROW_DETAIL_FIELD_SCROLL_MARGIN_TOP }}
      >
        <DialEllipsisTooltip text={row.label} className="dial-small-text text-primary min-w-0" />
      </div>
      <div
        className={mergeClasses(
          ROW_DETAIL_CELL_BASE,
          'relative',
          isRightAlignedRowDetailField(row) && 'text-right',
          hasScore && 'p-0 flex',
        )}
      >
        {isStatusRow ? (
          <StatusValue raw={raw} />
        ) : (
          <FieldValue
            raw={raw}
            isFailed={isFailed}
            isScoreIndicator={row.isScoreIndicator}
            failedLabel={failedLabel}
            onOverflowChange={setIsOverflowing}
          />
        )}
        {isOverflowing && (
          <button
            type="button"
            onClick={() => onOpenFullValue(row)}
            title={openFullValueLabel}
            aria-label={openFullValueLabel}
            className={mergeClasses(
              'absolute bottom-1 right-1 flex items-center justify-center size-[22px] rounded-sm bg-layer-4 text-secondary hover:text-primary',
              'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity',
            )}
          >
            <IconMaximize size={16} aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
};

export default ExecutionRowDetailRow;
