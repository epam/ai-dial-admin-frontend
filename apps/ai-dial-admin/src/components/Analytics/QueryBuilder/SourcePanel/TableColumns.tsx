'use client';

import { FC, useMemo } from 'react';

import { GhostButton, Spinner } from '@epam/ai-dial-ui-kit';

import ColumnRow from '@/src/components/Analytics/QueryBuilder/SourcePanel/ColumnRow';
import TagGroup from '@/src/components/Analytics/QueryBuilder/SourcePanel/TagGroup';
import { useSourcePanel } from '@/src/components/Analytics/QueryBuilder/SourcePanel/context';
import { ColumnLoadStatus, SourceTable } from '@/src/components/Analytics/QueryBuilder/SourcePanel/models';
import { groupColumnsByTag } from '@/src/components/Analytics/QueryBuilder/SourcePanel/utils/source-panel';
import { BasicI18nKey, QuerySourcePanelI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  id: string;
  table: SourceTable;
}

const TableColumns: FC<Props> = ({ id, table }) => {
  const t = useI18n();
  const { columns, onLoadColumns } = useSourcePanel();

  const load = columns[table.name];
  const tree = useMemo(() => groupColumnsByTag(load?.fields ?? [], table.tagOrder), [load?.fields, table.tagOrder]);

  if (!load || load.status === ColumnLoadStatus.Loading) {
    return (
      <div id={id} role="status" aria-label={t(BasicI18nKey.Loading)} className="flex h-8 items-center pl-17">
        <Spinner size={16} />
      </div>
    );
  }

  if (load.status === ColumnLoadStatus.Failed) {
    return (
      <div id={id} className="flex h-8 items-center gap-2 pl-17">
        <span role="alert" className="text-error dial-tiny-text">
          {t(QuerySourcePanelI18nKey.ColumnsLoadFailed)}
        </span>
        <GhostButton label={t(QuerySourcePanelI18nKey.Retry)} onClick={() => onLoadColumns(table.name)} />
      </div>
    );
  }

  return (
    <div id={id} className="mt-0.5 flex flex-col gap-0.5">
      {tree.groups.map((group) => (
        <TagGroup key={group.tag} tableName={table.name} group={group} />
      ))}
      {tree.untagged.length > 0 && (
        <ul className="flex flex-col gap-0.5">
          {tree.untagged.map((field) => (
            <ColumnRow key={field.name} field={field} />
          ))}
        </ul>
      )}
    </div>
  );
};

export default TableColumns;
