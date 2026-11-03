'use client';

import { FC } from 'react';

import DetailRow from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/DetailRow';
import { CompareRun } from '@/src/components/Runs/Compare/models';
import { RowDetailField, RowDetailSection } from '@/src/components/Runs/Details/RowDetails/models';
import SectionHeaderRow from '@/src/components/Runs/Details/RowDetails/SectionHeaderRow';

interface Props {
  section: RowDetailSection;
  sectionLabel: string;
  isCollapsed: boolean;
  onToggle: () => void;
  hasComparedMatch: boolean;
  noMatchLabel: string;
  failedLabel: string;
  onOpenDiff: (row: RowDetailField) => void;
  openDiffLabel: string;
  hideHighlights: boolean;
  runs: CompareRun[];
}

const SectionRows: FC<Props> = ({
  section,
  sectionLabel,
  isCollapsed,
  onToggle,
  hasComparedMatch,
  noMatchLabel,
  failedLabel,
  onOpenDiff,
  openDiffLabel,
  hideHighlights,
  runs,
}) => (
  <>
    <SectionHeaderRow label={sectionLabel} isCollapsed={isCollapsed} onToggle={onToggle} />
    {!isCollapsed &&
      section.rows.map((row) => (
        <DetailRow
          key={`${section.key}:${row.fieldKey}`}
          row={row}
          hasComparedMatch={hasComparedMatch}
          noMatchLabel={noMatchLabel}
          failedLabel={failedLabel}
          onOpenDiff={onOpenDiff}
          openDiffLabel={openDiffLabel}
          hideHighlights={hideHighlights}
          runs={runs}
        />
      ))}
  </>
);
export default SectionRows;
