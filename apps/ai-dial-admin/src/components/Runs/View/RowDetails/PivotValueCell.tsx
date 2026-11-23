'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import OpenPopup from '@/public/images/icons/open-pop-up.svg';

import CellCopyButton from '@/src/components/Runs/Details/RowDetails/CellCopyButton';
import FieldValue from '@/src/components/Runs/Details/RowDetails/FieldValue';
import ScoreThresholdTooltip from '@/src/components/Runs/Details/RowDetails/ScoreThresholdTooltip';
import StatusValue from '@/src/components/Runs/Details/RowDetails/StatusValue';
import { RowDetailField } from '@/src/components/Runs/Details/RowDetails/models';
import { canCopyFieldValue } from '@/src/components/Runs/Details/RowDetails/utils/can-copy-field-value';
import { getScoreFieldValue } from '@/src/components/Runs/Details/RowDetails/utils/score-field-value';
import { isRightAlignedRowDetailField } from '@/src/components/Runs/Details/RowDetails/utils/row-detail-alignment';
import { EXECUTION_STATUS_FIELD_KEY } from '@/src/components/Runs/Details/BottomDrawer/constants';
import RunValueModal from '@/src/components/Runs/View/RowDetails/RunValueModal';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { mergeClasses } from '@/src/utils/merge-classes';

interface Props {
  field: RowDetailField;
  /** Defaults to `field.primaryRaw` when omitted. */
  raw?: string | null;
  /** Defaults to `field.primaryFailed` when omitted. */
  isFailed?: boolean;
  /** Defaults to `field.primaryThreshold` when omitted. */
  threshold?: number | null;
  className?: string;
  'data-compare-diff'?: string;
  /** When set, opens this instead of the single-run popup (e.g. compare dual-run popup). */
  onOpenFullscreen?: () => void;
}

const VALUE_CELL_BASE =
  'p-3 border-b border-r border-tertiary min-w-0 overflow-hidden h-full w-full min-h-10 flex items-start self-stretch';

const PivotValueCell: FC<Props> = ({
  field,
  raw: rawProp,
  isFailed: isFailedProp,
  threshold: thresholdProp,
  className,
  'data-compare-diff': dataCompareDiff,
  onOpenFullscreen,
}) => {
  const t = useI18n();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const failedLabel = t(RunsI18nKey.MetricFailedText);
  const raw = rawProp !== undefined ? rawProp : field.primaryRaw;
  const isFailed = isFailedProp !== undefined ? isFailedProp : (field.primaryFailed ?? false);
  const threshold = thresholdProp !== undefined ? thresholdProp : field.primaryThreshold;
  const isStatusRow = field.fieldKey === EXECUTION_STATUS_FIELD_KEY && !field.isMetric;
  const isRightAligned = isRightAlignedRowDetailField(field);
  const hasScore = !isStatusRow && getScoreFieldValue(raw, field.isScoreIndicator, isFailed) != null;
  const canCopy = canCopyFieldValue(field, raw, isFailed) && raw != null;

  const onOpen = useCallback(() => {
    if (onOpenFullscreen) {
      onOpenFullscreen();
      return;
    }
    setIsPopupOpen(true);
  }, [onOpenFullscreen]);
  const onClose = useCallback(() => setIsPopupOpen(false), []);
  // The popup shows what the cell shows, so a value passed in `raw` / `isFailed` reaches it too.
  const popupField = useMemo<RowDetailField>(
    () => ({ ...field, primaryRaw: raw, primaryFailed: isFailed }),
    [field, raw, isFailed],
  );

  return (
    <>
      <ScoreThresholdTooltip raw={raw} threshold={threshold}>
        <div className="group/cell relative h-full min-h-10 min-w-0 self-stretch">
          <button
            type="button"
            onClick={onOpen}
            aria-haspopup="dialog"
            data-field-key={field.fieldKey}
            {...(dataCompareDiff ? { 'data-compare-diff': dataCompareDiff } : {})}
            className={mergeClasses(
              VALUE_CELL_BASE,
              'relative group bg-layer-3 hover:bg-layer-4 focus-visible:bg-layer-4 outline-hidden focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-focus',
              isRightAligned ? 'justify-end text-right' : 'text-left',
              hasScore && 'p-0 border-r-0 border-b-0',
              className,
            )}
          >
            {isStatusRow ? (
              <StatusValue raw={raw} />
            ) : (
              <FieldValue
                raw={raw}
                isFailed={isFailed}
                isScoreIndicator={field.isScoreIndicator}
                threshold={threshold}
                failedLabel={failedLabel}
                fill
              />
            )}
            <span
              className="pointer-events-none absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity size-4 text-secondary"
              aria-hidden
            >
              <OpenPopup />
            </span>
          </button>
          {canCopy && <CellCopyButton label={field.label} value={raw} />}
        </div>
      </ScoreThresholdTooltip>
      {!onOpenFullscreen && isPopupOpen && <RunValueModal field={popupField} onClose={onClose} />}
    </>
  );
};

export default PivotValueCell;
