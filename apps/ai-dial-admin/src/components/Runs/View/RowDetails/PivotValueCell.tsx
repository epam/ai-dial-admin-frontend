'use client';

import { FC, useCallback, useState } from 'react';

import OpenPopup from '@/public/images/icons/open-pop-up.svg';

import FieldValue from '@/src/components/Runs/Details/RowDetails/FieldValue';
import StatusValue from '@/src/components/Runs/Details/RowDetails/StatusValue';
import { RowDetailField } from '@/src/components/Runs/Details/RowDetails/models';
import { EXECUTION_STATUS_FIELD_KEY } from '@/src/components/Runs/Details/BottomDrawer/constants';
import FullscreenValueViewer from '@/src/components/Runs/View/RowDetails/FullscreenValueViewer';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { mergeClasses } from '@/src/utils/merge-classes';

interface Props {
  field: RowDetailField;
  className?: string;
}

const VALUE_CELL_BASE =
  'p-3 border-b border-r border-tertiary min-w-0 overflow-hidden h-full min-h-10 flex items-start self-stretch';

const PivotValueCell: FC<Props> = ({ field, className }) => {
  const t = useI18n();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const failedLabel = t(RunsI18nKey.MetricFailedText);
  const raw = field.primaryRaw;
  const isStatusRow = field.fieldKey === EXECUTION_STATUS_FIELD_KEY && !field.isMetric;

  const onOpen = useCallback(() => setIsPopupOpen(true), []);
  const onClose = useCallback(() => setIsPopupOpen(false), []);

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        data-field-key={field.fieldKey}
        className={mergeClasses(VALUE_CELL_BASE, 'relative group text-left hover:bg-layer-4 bg-layer-3', className)}
      >
        {isStatusRow ? (
          <StatusValue raw={raw} />
        ) : (
          <FieldValue
            raw={raw}
            isFailed={field.primaryFailed ?? false}
            isScoreIndicator={field.isScoreIndicator}
            failedLabel={failedLabel}
            fill
          />
        )}
        <span
          className="pointer-events-none absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity size-4 text-secondary"
          aria-hidden
        >
          <OpenPopup />
        </span>
      </button>
      {isPopupOpen && <FullscreenValueViewer isOpen fieldLabel={field.label} value={raw ?? ''} onClose={onClose} />}
    </>
  );
};

export default PivotValueCell;
