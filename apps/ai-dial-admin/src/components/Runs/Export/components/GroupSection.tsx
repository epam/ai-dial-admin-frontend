'use client';

import { FC, useMemo, useState } from 'react';

import { DialCheckbox } from '@epam/ai-dial-ui-kit';

import { ColumnGroup, ColumnItem } from '@/src/components/Runs/Export/models';
import { ColumnGroupId, getCheckState, GROUP_LABEL_KEY } from '@/src/components/Runs/Export/utils/group-columns';
import { useI18n } from '@/src/locales/client';
import CollapseButton from './CollapseButton';
import MetricSubSection from './MetricSubSection';

interface GroupSectionProps {
  group: ColumnGroup;
  checkedColumns: Set<string>;
  onToggleColumn: (columnName: string, checked?: boolean) => void;
  onToggleGroup: (groupId: ColumnGroupId, checked?: boolean) => void;
}

const GroupSection: FC<GroupSectionProps> = ({ group, checkedColumns, onToggleColumn, onToggleGroup }) => {
  const t = useI18n();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const checkState = getCheckState(group.columns, checkedColumns);

  const subGroupMap = useMemo(() => {
    if (group.id !== ColumnGroupId.Metrics) return null;
    const map = new Map<string, ColumnItem[]>();
    for (const col of group.columns) {
      const key = col.subGroup ?? '';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(col);
    }
    return map;
  }, [group]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <CollapseButton isCollapsed={isCollapsed} onToggle={() => setIsCollapsed((prev) => !prev)} />
        <DialCheckbox
          id={`group-${group.id}`}
          label={t(GROUP_LABEL_KEY[group.id])}
          checked={checkState === 'checked'}
          indeterminate={checkState === 'indeterminate'}
          onChange={(value) => onToggleGroup(group.id, value)}
        />
      </div>

      {!isCollapsed && (
        <>
          {subGroupMap ? (
            // MetricSubSections have their own chevrons — no extra indent needed
            <div className="flex flex-col gap-3">
              {Array.from(subGroupMap.entries()).map(([metricName, items]) => (
                <MetricSubSection
                  key={metricName}
                  metricName={metricName}
                  items={items}
                  checkedColumns={checkedColumns}
                  onToggleColumn={onToggleColumn}
                />
              ))}
            </div>
          ) : (
            // Leaf columns have no chevron — use bigger indent
            <div className="grid grid-cols-3 gap-2 pl-12">
              {group.columns.map((item) => (
                <DialCheckbox
                  key={item.name}
                  id={`col-${item.name}`}
                  label={item.displayName}
                  checked={checkedColumns.has(item.name)}
                  onChange={(value) => onToggleColumn(item.name, value)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GroupSection;
