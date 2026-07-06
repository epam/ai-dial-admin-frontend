'use client';

import { FC } from 'react';

import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';

import DetailRow from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/DetailRow';
import {
  CompareRowDetailField,
  CompareRowDetailSection,
} from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/models';

interface Props {
  section: CompareRowDetailSection;
  sectionLabel: string;
  isCollapsed: boolean;
  onToggle: () => void;
  hasComparedMatch: boolean;
  noMatchLabel: string;
  failedLabel: string;
  onOpenDiff: (row: CompareRowDetailField) => void;
  openDiffLabel: string;
  hideHighlights: boolean;
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
}) => (
  <>
    <div
      className="cursor-pointer hover:bg-layer-2 p-3 border-b border-tertiary bg-layer-3"
      style={{ gridColumn: '1 / -1' }}
      onClick={onToggle}
    >
      <div className="flex items-center gap-1 dial-small-text text-secondary">
        {isCollapsed ? <IconChevronRight size={12} /> : <IconChevronDown size={12} />}
        {sectionLabel}
      </div>
    </div>
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
        />
      ))}
  </>
);

export default SectionRows;
