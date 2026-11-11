'use client';

import { FC, useCallback } from 'react';

import OpenPopup from '@/public/images/icons/open-pop-up.svg';

import CellCopyButton from '@/src/components/Runs/Details/RowDetails/CellCopyButton';
import FieldValue from '@/src/components/Runs/Details/RowDetails/FieldValue';
import { canCopyFieldValue } from '@/src/components/Runs/Details/RowDetails/utils/can-copy-field-value';
import ScoreThresholdTooltip from '@/src/components/Runs/Details/RowDetails/ScoreThresholdTooltip';
import StatusValue from '@/src/components/Runs/Details/RowDetails/StatusValue';
import { RowDetailField } from '@/src/components/Runs/Details/RowDetails/models';
import { isRightAlignedRowDetailField } from '@/src/components/Runs/Details/RowDetails/utils/row-detail-alignment';
import { getScoreFieldValue } from '@/src/components/Runs/Details/RowDetails/utils/score-field-value';
import { EXECUTION_STATUS_FIELD_KEY } from '@/src/components/Runs/Details/BottomDrawer/constants';
import {
  EXECUTION_ROW_DETAIL_CELL_BASE,
  EXECUTION_ROW_DETAIL_CLAMP_CLASS,
} from '@/src/components/Runs/View/RowDetails/constants';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { mergeClasses } from '@/src/utils/merge-classes';

interface Props {
  field: RowDetailField;
  onOpen: (field: RowDetailField) => void;
}

/** A value cell of the side panel: the value clamped to three lines under a button that covers the whole cell. */
const ExpandableValueCell: FC<Props> = ({ field, onOpen }) => {
  const t = useI18n();
  const raw = field.primaryRaw;
  const isFailed = field.primaryFailed ?? false;
  const isStatusRow = field.fieldKey === EXECUTION_STATUS_FIELD_KEY && !field.isMetric;
  const hasScore = !isStatusRow && getScoreFieldValue(raw, field.isScoreIndicator, isFailed) != null;

  const canCopy = canCopyFieldValue(field, raw, isFailed) && raw != null;

  const onOpenFullValue = useCallback(() => onOpen(field), [onOpen, field]);

  return (
    <ScoreThresholdTooltip raw={raw} threshold={field.primaryThreshold}>
      <div
        className={mergeClasses(
          EXECUTION_ROW_DETAIL_CELL_BASE,
          'group/cell',
          isRightAlignedRowDetailField(field) && 'justify-end text-right',
          hasScore ? 'p-0' : 'group-hover:bg-accent-primary-alpha',
        )}
      >
        {isStatusRow ? (
          <StatusValue raw={raw} />
        ) : (
          <FieldValue
            raw={raw}
            isFailed={isFailed}
            isScoreIndicator={field.isScoreIndicator}
            threshold={field.primaryThreshold}
            failedLabel={t(RunsI18nKey.MetricFailedText)}
            clampClassName={EXECUTION_ROW_DETAIL_CLAMP_CLASS}
          />
        )}
        <button
          type="button"
          onClick={onOpenFullValue}
          aria-label={t(RunsI18nKey.OpenFullValue, { field: field.label })}
          aria-haspopup="dialog"
          className="group/open absolute inset-0 cursor-pointer outline-hidden focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-focus"
        >
          <span
            className="absolute bottom-1 right-1 size-4 text-secondary opacity-0 transition-opacity group-hover/cell:opacity-100 group-focus-visible/open:opacity-100"
            aria-hidden
          >
            <OpenPopup />
          </span>
        </button>
        {canCopy && <CellCopyButton label={field.label} value={raw} />}
      </div>
    </ScoreThresholdTooltip>
  );
};

export default ExpandableValueCell;
