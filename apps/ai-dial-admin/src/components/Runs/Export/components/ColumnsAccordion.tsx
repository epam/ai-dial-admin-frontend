'use client';

import { FC, useMemo } from 'react';

import { DialLoader } from '@epam/ai-dial-ui-kit';

import Accordion from '@/src/components/Common/Accordion/Accordion';
import { ColumnGroup } from '@/src/components/Runs/Export/models';
import { ColumnGroupId } from '@/src/components/Runs/Export/utils/group-columns';
import { ExportRunI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import GroupSection from './GroupSection';

interface Props {
  groups: ColumnGroup[];
  checkedColumns: Set<string>;
  isLoading?: boolean;
  onToggleColumn: (columnName: string, checked?: boolean) => void;
  onToggleGroup: (groupId: ColumnGroupId, checked?: boolean) => void;
}

const ColumnsAccordion: FC<Props> = ({ groups, checkedColumns, isLoading, onToggleColumn, onToggleGroup }) => {
  const t = useI18n();

  const totalColumns = useMemo(() => groups.reduce((acc, g) => acc + g.columns.length, 0), [groups]);
  const selectedCount = useMemo(() => checkedColumns.size, [checkedColumns]);

  const title = `${t(ExportRunI18nKey.ColumnsAccordionLabel)} (${selectedCount} / ${totalColumns})`;

  return (
    <Accordion title={title} collapsed={false}>
      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <DialLoader size={24} className="text-primary" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <GroupSection
              key={group.id}
              group={group}
              checkedColumns={checkedColumns}
              onToggleColumn={onToggleColumn}
              onToggleGroup={onToggleGroup}
            />
          ))}
        </div>
      )}
    </Accordion>
  );
};

export default ColumnsAccordion;
