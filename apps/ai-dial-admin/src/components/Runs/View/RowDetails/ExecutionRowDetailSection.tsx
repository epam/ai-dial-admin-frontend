'use client';

import { FC } from 'react';

import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';

import { RowDetailField, RowDetailSection } from '@/src/components/Runs/Details/RowDetails/models';
import ExecutionRowDetailRow from '@/src/components/Runs/View/RowDetails/ExecutionRowDetailRow';

interface Props {
  section: RowDetailSection;
  sectionLabel: string;
  isCollapsed: boolean;
  onToggle: () => void;
  failedLabel: string;
  openFullValueLabel: string;
  onOpenFullValue: (row: RowDetailField) => void;
}

const ExecutionRowDetailSection: FC<Props> = ({
  section,
  sectionLabel,
  isCollapsed,
  onToggle,
  failedLabel,
  openFullValueLabel,
  onOpenFullValue,
}) => (
  <>
    <button
      type="button"
      className="cursor-pointer hover:bg-layer-2 p-3 border-b border-tertiary bg-layer-3 text-left w-full"
      style={{ gridColumn: '1 / -1' }}
      onClick={onToggle}
      aria-expanded={!isCollapsed}
    >
      <div className="flex items-center gap-1 dial-small-text text-secondary">
        {isCollapsed ? <IconChevronRight size={12} aria-hidden /> : <IconChevronDown size={12} aria-hidden />}
        {sectionLabel}
      </div>
    </button>
    {!isCollapsed &&
      section.rows.map((row) => (
        <ExecutionRowDetailRow
          key={`${section.key}:${row.fieldKey}`}
          row={row}
          failedLabel={failedLabel}
          openFullValueLabel={openFullValueLabel}
          onOpenFullValue={onOpenFullValue}
        />
      ))}
  </>
);

export default ExecutionRowDetailSection;
