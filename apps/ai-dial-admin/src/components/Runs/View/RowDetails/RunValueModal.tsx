'use client';

import { FC, useCallback } from 'react';

import { SINGLE_RUN_COLUMNS } from '@/src/components/Runs/Details/ValuePopups/constants';
import ScoreModal from '@/src/components/Runs/Details/ValuePopups/ScoreModal';
import { RowDetailField } from '@/src/components/Runs/Details/RowDetails/models';
import FullscreenValueViewer from '@/src/components/Runs/View/RowDetails/FullscreenValueViewer';

interface Props {
  field: RowDetailField;
  onClose: () => void;
}

/** The popup a single run's value cell opens: the score view for a metric field, the text popup for every other. */
const RunValueModal: FC<Props> = ({ field, onClose }) => {
  const getRunLabel = useCallback(() => field.label, [field.label]);

  if (field.isMetric) {
    return (
      <ScoreModal
        field={field}
        runs={SINGLE_RUN_COLUMNS}
        hasComparedMatch
        getRunLabel={getRunLabel}
        onClose={onClose}
      />
    );
  }

  return <FullscreenValueViewer isOpen fieldLabel={field.label} value={field.primaryRaw ?? ''} onClose={onClose} />;
};

export default RunValueModal;
