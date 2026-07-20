'use client';

import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { ICellRendererParams } from 'ag-grid-community';
import classNames from 'classnames';

import { GridRowType, GroupedGridRow } from '@/src/models/evaluation/test-case-grouping';

interface TurnExpanderCellRendererParams extends ICellRendererParams<GroupedGridRow> {
  onToggleExpand?: (groupKey: string) => void;
}

/**
 * Leading-column renderer for grouped test-case grids: a chevron toggle on GROUP summary rows, an
 * indent spacer on TURN rows, and nothing on SINGLE rows.
 */
const TurnExpanderCellRenderer = ({ data, onToggleExpand }: TurnExpanderCellRendererParams) => {
  if (!data) return null;

  if (data.rowType === GridRowType.TURN) {
    return (
      <div className="flex items-center justify-end h-full pr-1" style={{ paddingLeft: 24 }}>
        <span className="size-1.5 rounded-full bg-tertiary" />
      </div>
    );
  }

  if (data.rowType !== GridRowType.GROUP) return null;

  const expanded = Boolean(data.expanded);

  return (
    <div className="flex items-center h-full">
      <div
        className="flex items-center justify-center w-[18px] h-[18px] shrink-0 rounded cursor-pointer hover:bg-layer-3"
        role="button"
        aria-label={expanded ? 'Collapse test case' : 'Expand test case'}
        onClick={() => onToggleExpand?.(data.groupKey)}
      >
        {expanded ? (
          <IconChevronDown size={14} className={classNames('text-secondary')} />
        ) : (
          <IconChevronRight size={14} className={classNames('text-secondary')} />
        )}
      </div>
    </div>
  );
};

export default TurnExpanderCellRenderer;
