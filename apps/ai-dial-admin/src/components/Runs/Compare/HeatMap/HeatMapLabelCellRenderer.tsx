'use client';

import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { ICellRendererParams } from 'ag-grid-community';
import { FC } from 'react';

import CompareRunIndexBadge from '@/src/components/Runs/Compare/CompareRunIndexBadge';
import { HeatMapRow, HeatMapRowType } from '@/src/components/Runs/Compare/HeatMap/models';
import { RUN_COMPARE_PRIMARY_INDEX, RUN_COMPARE_SECONDARY_INDEX } from '@/src/components/Runs/Compare/constants';

interface HeatMapLabelCellRendererParams extends ICellRendererParams<HeatMapRow> {
  expandedGroups: Set<string>;
  onToggleGroup: (groupKey: string) => void;
}

const HeatMapLabelCellRenderer: FC<HeatMapLabelCellRendererParams> = ({ data, expandedGroups, onToggleGroup }) => {
  if (!data) {
    return null;
  }

  if (data.rowType === HeatMapRowType.Group) {
    const isExpanded = expandedGroups.has(data.groupKey);

    return (
      <button
        type="button"
        className="flex items-center gap-2 w-full h-full text-left text-primary dial-small-text"
        onClick={() => onToggleGroup(data.groupKey)}
        aria-expanded={isExpanded}
      >
        {isExpanded ? (
          <IconChevronDown size={16} className="shrink-0" />
        ) : (
          <IconChevronRight size={16} className="shrink-0" />
        )}
        <span className="truncate">{data.label}</span>
      </button>
    );
  }

  const runIndex =
    data.runIndex === RUN_COMPARE_SECONDARY_INDEX ? RUN_COMPARE_SECONDARY_INDEX : RUN_COMPARE_PRIMARY_INDEX;

  return (
    <div className="flex items-center gap-2 pl-9 h-full text-primary dial-small-text">
      {data.runIndex != null && <CompareRunIndexBadge runIndex={runIndex} />}
      <span className="truncate">{data.label}</span>
    </div>
  );
};

export default HeatMapLabelCellRenderer;
