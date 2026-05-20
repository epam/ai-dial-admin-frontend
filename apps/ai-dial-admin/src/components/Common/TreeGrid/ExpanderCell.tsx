'use client';

import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { ICellRendererParams } from 'ag-grid-community';
import classNames from 'classnames';

import { TreeRow } from './types';

interface ExpanderCellParams extends ICellRendererParams<TreeRow<Record<string, unknown>>> {
  onToggleExpand?: (row: TreeRow<Record<string, unknown>>) => void;
}

const ExpanderCell = ({ data, value, onToggleExpand }: ExpanderCellParams) => {
  if (!data) return null;

  const { depth, children, expanded, synthetic } = data;
  const hasChildren = children.length > 0;

  return (
    <div className="flex items-center h-full gap-1" style={{ paddingLeft: depth * 24 }}>
      <div
        className={classNames(
          'flex items-center justify-center w-[18px] h-[18px] shrink-0 rounded',
          hasChildren && 'cursor-pointer hover:bg-layer-3',
        )}
        onClick={() => {
          if (!hasChildren) return;
          onToggleExpand?.(data);
        }}
      >
        {hasChildren ? (
          expanded ? (
            <IconChevronDown size={14} className={classNames('text-secondary', synthetic && 'opacity-40')} />
          ) : (
            <IconChevronRight size={14} className={classNames('text-secondary', synthetic && 'opacity-40')} />
          )
        ) : (
          <span className="size-1.5 rounded-full bg-tertiary" />
        )}
      </div>
      <span className={classNames(synthetic && 'italic')}>{value}</span>
    </div>
  );
};

export default ExpanderCell;
