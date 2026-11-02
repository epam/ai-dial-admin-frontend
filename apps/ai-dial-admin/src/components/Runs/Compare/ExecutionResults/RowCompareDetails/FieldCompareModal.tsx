'use client';

import { FC } from 'react';

import ScoreModal from '@/src/components/Runs/Details/ValuePopups/ScoreModal';
import { getRowDetailRunValue } from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/utils/run-field-values';
import { CompareRun } from '@/src/components/Runs/Compare/models';
import FullscreenDiffViewer from '@/src/components/Runs/Details/BottomDrawer/FullscreenDiffViewer';
import { RowDetailField } from '@/src/components/Runs/Details/RowDetails/models';

interface Props {
  field: RowDetailField;
  runs: CompareRun[];
  hasComparedMatch: boolean;
  getRunLabel: (run: CompareRun) => string;
  onClose: () => void;
}

/** The popup a compare cell opens: score, reason and logs for a metric field, a text diff for every other. */
const FieldCompareModal: FC<Props> = ({ field, runs, hasComparedMatch, getRunLabel, onClose }) => {
  if (field.isMetric) {
    return (
      <ScoreModal
        field={field}
        runs={runs}
        hasComparedMatch={hasComparedMatch}
        getRunLabel={getRunLabel}
        onClose={onClose}
      />
    );
  }

  const first = runs[0];
  const last = runs[runs.length - 1];

  return (
    <FullscreenDiffViewer
      isOpen
      fieldLabel={field.label}
      original={getRowDetailRunValue(field, first.slot).raw ?? ''}
      modified={getRowDetailRunValue(field, last.slot).raw ?? ''}
      originalLabel={getRunLabel(first)}
      modifiedLabel={getRunLabel(last)}
      onClose={onClose}
    />
  );
};

export default FieldCompareModal;
