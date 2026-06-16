'use client';

import { FC, useMemo } from 'react';

import { DialLoader, DialNoDataContent } from '@epam/ai-dial-ui-kit';

import { ColumnGroup, ColumnItem } from '@/src/components/Runs/Export/models';
import { ColumnGroupId } from '@/src/components/Runs/Export/utils/group-columns';
import { ExportRunI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import GroupSection from './GroupSection';
import MetricSubSection from './MetricSubSection';

interface Props {
  groups: ColumnGroup[];
  checkedColumns: Set<string>;
  isLoading?: boolean;
  onToggleColumn: (columnName: string, checked?: boolean) => void;
  onToggleGroup: (groupId: ColumnGroupId, checked?: boolean) => void;
}

const Columns: FC<Props> = ({ groups, checkedColumns, isLoading, onToggleColumn, onToggleGroup }) => {
  const t = useI18n();
  const metricsSubGroupMap = useMemo(() => {
    const metricsGroup = groups.find((g) => g.id === ColumnGroupId.Metrics);
    if (!metricsGroup) return new Map<string, ColumnItem[]>();
    const map = new Map<string, ColumnItem[]>();
    for (const col of metricsGroup.columns) {
      const key = col.subGroup ?? '';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(col);
    }
    return map;
  }, [groups]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-6">
        <DialLoader size={60} className="text-primary" />
      </div>
    );
  }

  if (groups.length === 0) {
    return <DialNoDataContent title={t(ExportRunI18nKey.NoColumns)} />;
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => {
        if (group.id === ColumnGroupId.Metrics) {
          return Array.from(metricsSubGroupMap.entries()).map(([metricName, items]) => (
            <MetricSubSection
              key={`metric-${metricName}`}
              metricName={metricName}
              items={items}
              checkedColumns={checkedColumns}
              onToggleColumn={onToggleColumn}
            />
          ));
        }
        return (
          <GroupSection
            key={group.id}
            group={group}
            checkedColumns={checkedColumns}
            onToggleColumn={onToggleColumn}
            onToggleGroup={onToggleGroup}
          />
        );
      })}
    </div>
  );
};

export default Columns;
