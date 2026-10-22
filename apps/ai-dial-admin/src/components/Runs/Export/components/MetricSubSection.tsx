'use client';

import { FC, useState } from 'react';

import { Checkbox } from '@epam/ai-dial-ui-kit';

import { ColumnItem } from '@/src/components/Runs/Export/models';
import { getCheckState } from '@/src/components/Runs/Export/utils/group-columns';
import CollapseButton from './CollapseButton';

interface MetricSubSectionProps {
  metricName: string;
  items: ColumnItem[];
  checkedColumns: Set<string>;
  onToggleColumn: (name: string, checked?: boolean) => void;
}

const MetricSubSection: FC<MetricSubSectionProps> = ({ metricName, items, checkedColumns, onToggleColumn }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const checkState = getCheckState(items, checkedColumns);

  const handleToggleAll = (checked?: boolean) => {
    items.forEach((item) => onToggleColumn(item.name, checked));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <CollapseButton isCollapsed={isCollapsed} onToggle={() => setIsCollapsed((prev) => !prev)} />
        <Checkbox
          id={`metric-sub-${metricName}`}
          labelProps={{ label: `metric:${metricName}` }}
          isSelected={checkState === 'checked'}
          isIndeterminate={checkState === 'indeterminate'}
          onChange={handleToggleAll}
        />
      </div>
      {!isCollapsed && (
        <div className="grid grid-cols-3 gap-2 pl-12">
          {items.map((item) => (
            <Checkbox
              key={item.name}
              id={`col-${item.name}`}
              className="items-start"
              labelProps={{ label: <span className="text-primary break-words flex-1 min-w-0">{item.name}</span> }}
              isSelected={checkedColumns.has(item.name)}
              onChange={(value) => onToggleColumn(item.name, value)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MetricSubSection;
