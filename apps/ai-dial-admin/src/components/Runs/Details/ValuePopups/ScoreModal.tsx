'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import { Popup, PopupSize } from '@epam/ai-dial-ui-kit';

import { CompareRun } from '@/src/components/Runs/Compare/models';
import { MetricInfoSection, ScoreRunData } from '@/src/components/Runs/Details/ValuePopups/models';
import ScoreColumn from '@/src/components/Runs/Details/ValuePopups/ScoreColumn';
import { getScoreRunData } from '@/src/components/Runs/Details/ValuePopups/utils';
import { RowDetailField } from '@/src/components/Runs/Details/RowDetails/models';
import { TextDiffRanges } from '@/src/models/text-diff';
import { getWordDiffRanges } from '@/src/utils/text-diff';

interface Props {
  field: RowDetailField;
  runs: CompareRun[];
  hasComparedMatch: boolean;
  getRunLabel: (run: CompareRun) => string;
  onClose: () => void;
}

const NO_DIFF: TextDiffRanges = { original: [], modified: [] };

// Reason is what a reader opens this view for; logs are the long tail behind it.
const DEFAULT_OPEN_SECTION = MetricInfoSection.Reason;

const ScoreModal: FC<Props> = ({ field, runs, hasComparedMatch, getRunLabel, onClose }) => {
  // One section at a time: both are tall, and two open at once would leave neither room to read.
  const [openSection, setOpenSection] = useState<MetricInfoSection | null>(DEFAULT_OPEN_SECTION);

  const columns = useMemo<ScoreRunData[]>(
    () => runs.map((run) => getScoreRunData(field, run, getRunLabel(run), hasComparedMatch)),
    [field, runs, getRunLabel, hasComparedMatch],
  );
  const isComparison = columns.length > 1;

  const reasonDiff = useMemo(() => {
    const first = columns[0];
    const last = columns[columns.length - 1];
    if (columns.length < 2 || !first.reason || !last.reason) return NO_DIFF;
    return getWordDiffRanges(first.reason.text, last.reason.text);
  }, [columns]);

  const onToggleSection = useCallback(
    (section: MetricInfoSection) => setOpenSection((prev) => (prev === section ? null : section)),
    [],
  );

  const getReasonHighlights = (index: number) => {
    if (index === 0) return reasonDiff.original;
    return index === columns.length - 1 ? reasonDiff.modified : NO_DIFF.modified;
  };

  return (
    <Popup
      onClose={onClose}
      header={field.label}
      headerDivider
      portalId="ScoreModal"
      open
      size={PopupSize.Lg}
      className="md:h-[80vh] bg-layer-3"
    >
      <div
        className="grid h-full min-h-0 divide-x divide-tertiary overflow-auto"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
      >
        {columns.map((column, index) => (
          <ScoreColumn
            key={column.run.slot}
            data={column}
            hasRunHeader={isComparison}
            openSection={openSection}
            reasonHighlights={getReasonHighlights(index)}
            onToggleSection={onToggleSection}
          />
        ))}
      </div>
    </Popup>
  );
};

export default ScoreModal;
