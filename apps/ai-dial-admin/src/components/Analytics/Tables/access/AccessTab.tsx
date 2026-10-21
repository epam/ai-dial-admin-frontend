'use client';

import { Button, ButtonVariant, DialEllipsisTooltip, Search } from '@epam/ai-dial-ui-kit';
import { IconPlus, IconUsersGroup } from '@tabler/icons-react';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import classNames from 'classnames';
import { FC, useMemo, useState } from 'react';

import FilterToggle from '@/src/components/Analytics/Tables/access/FilterToggle';
import PrivilegeMarkCell from '@/src/components/Analytics/Tables/access/PrivilegeMarkCell';
import RemoveRoleDialog from '@/src/components/Analytics/Tables/access/RemoveRoleDialog';
import RoleDrawer from '@/src/components/Analytics/Tables/access/RoleDrawer';
import { MARKED_PRIVILEGES } from '@/src/components/Analytics/Tables/access/constants';
import { AccessStatus, PrivilegeMark, RoleRow, RowsCellKind } from '@/src/components/Analytics/Tables/access/models';
import { TableAccessState } from '@/src/components/Analytics/Tables/access/use-table-access';
import { summarizeFilter } from '@/src/components/Analytics/Tables/access/utils';
import SensitiveIndicator from '@/src/components/Common/SensitiveIndicator/SensitiveIndicator';
import GridView from '@/src/components/Grid/GridView/GridView';
import { ACTION_COLUMN, ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { getRemoveOperation } from '@/src/constants/grid-columns/actions';
import { AnalyticsTableAccessI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';
import { AnalyticsTableColumn } from '@/src/models/analytics/table';

interface Props {
  tableName: string;
  columns: AnalyticsTableColumn[];
  isSystem: boolean;
  access: TableAccessState;
}

const AccessTab: FC<Props> = ({ tableName, columns, isSystem, access }) => {
  const t = useI18n();
  // `undefined` is closed, `null` adds a role, a name edits that role.
  const [drawerRole, setDrawerRole] = useState<string | null | undefined>(undefined);
  const [removedRow, setRemovedRow] = useState<RoleRow | null>(null);
  const [search, setSearch] = useState('');
  const [isCanReadOnly, setIsCanReadOnly] = useState(false);
  const [isRowsLimitedOnly, setIsRowsLimitedOnly] = useState(false);

  const isReady = access.status === AccessStatus.Ready;
  const isEmptyTable = isReady && access.rows.length === 0;

  const rows = useMemo(
    () =>
      access.rows.filter(
        (row) =>
          row.role.toLowerCase().includes(search.trim().toLowerCase()) &&
          (!isCanReadOnly || row.marks.read !== PrivilegeMark.None) &&
          (!isRowsLimitedOnly || row.rowsKind === RowsCellKind.Policy),
      ),
    [access.rows, search, isCanReadOnly, isRowsLimitedOnly],
  );

  const rowActions: ActionMenuOperationDeclaration<RoleRow>[] = useMemo(
    () => [
      getRemoveOperation<RoleRow>(
        (row) => row && setRemovedRow(row),
        () => !isReady,
      ),
    ],
    [isReady],
  );

  const columnDefs: ColDef[] = useMemo(
    () => [
      {
        headerName: t(AnalyticsTableAccessI18nKey.ColRole),
        field: 'role',
        flex: 2,
        cellRenderer: ({ data }: ICellRendererParams<RoleRow>) =>
          data && (
            <span className="flex items-center gap-2">
              <span className="font-mono">{data.role}</span>
              {data.isSensitive && <SensitiveIndicator />}
            </span>
          ),
      },
      ...MARKED_PRIVILEGES.map(
        ({ key, label }): ColDef => ({
          headerName: t(label),
          colId: key,
          width: 88,
          cellRenderer: ({ data }: ICellRendererParams<RoleRow>) =>
            data && <PrivilegeMarkCell privilege={t(label)} mark={data.marks[key]} />,
        }),
      ),
      {
        headerName: t(AnalyticsTableAccessI18nKey.ColRows),
        colId: 'rows',
        flex: 3,
        cellRenderer: ({ data }: ICellRendererParams<RoleRow>) => {
          if (!data) return null;
          if (data.rowsKind === RowsCellKind.Policy && data.filter) {
            return <DialEllipsisTooltip className="font-mono" text={summarizeFilter(data.filter)} />;
          }

          return (
            <span className={classNames(data.rowsKind === RowsCellKind.None && 'text-secondary')}>
              {t(
                data.rowsKind === RowsCellKind.All
                  ? AnalyticsTableAccessI18nKey.AllRows
                  : AnalyticsTableAccessI18nKey.CannotReadRows,
              )}
            </span>
          );
        },
      },
      ACTION_COLUMN(rowActions),
    ],
    [t, rowActions],
  );

  const onOpenRow = (field: string | undefined, row: RoleRow | undefined) => {
    if (field === ACTIONS_COLUMN_CEL_ID || !row || !isReady) return;
    setDrawerRole(row.role);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex items-center gap-3">
        {!isEmptyTable && (
          <>
            <div className="w-[260px]">
              <Search
                aria-label={t(AnalyticsTableAccessI18nKey.SearchRoles)}
                placeholder={t(AnalyticsTableAccessI18nKey.SearchRoles)}
                value={search}
                onChange={(value) => setSearch(value ?? '')}
              />
            </div>
            <FilterToggle
              label={t(AnalyticsTableAccessI18nKey.FilterCanRead)}
              isPressed={isCanReadOnly}
              onToggle={() => setIsCanReadOnly((prev) => !prev)}
            />
            <FilterToggle
              label={t(AnalyticsTableAccessI18nKey.FilterRowsLimited)}
              isPressed={isRowsLimitedOnly}
              onToggle={() => setIsRowsLimitedOnly((prev) => !prev)}
            />
          </>
        )}
        <Button
          className="ml-auto"
          variant={ButtonVariant.Primary}
          iconBefore={<IconPlus size={16} aria-hidden />}
          label={t(AnalyticsTableAccessI18nKey.AddRole)}
          disabled={!isReady}
          onClick={() => setDrawerRole(null)}
        />
      </div>

      {isEmptyTable ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <IconUsersGroup size={32} className="text-secondary" aria-hidden />
          <span className="dial-body-semi-text">{t(AnalyticsTableAccessI18nKey.EmptyTitle)}</span>
          <span className="dial-small-text text-secondary">{t(AnalyticsTableAccessI18nKey.EmptyDescription)}</span>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <GridView
            columnDefs={columnDefs}
            rowData={rows}
            getRowId={(params) => params.data.role}
            additionalGridOptions={{
              onCellClicked: (e) => onOpenRow(e.colDef.field, e.data),
              onCellKeyDown: (e) => {
                if ((e.event as KeyboardEvent | null)?.key !== 'Enter') return;
                onOpenRow('colDef' in e ? e.colDef.field : undefined, e.data);
              },
            }}
            emptyDataProps={{ title: t(AnalyticsTableAccessI18nKey.NoMatches) }}
          />
        </div>
      )}

      {drawerRole !== undefined && (
        <RoleDrawer
          tableName={tableName}
          columns={columns}
          isSystem={isSystem}
          access={access}
          role={drawerRole}
          onClose={() => setDrawerRole(undefined)}
        />
      )}
      {removedRow && (
        <RemoveRoleDialog
          tableName={tableName}
          row={removedRow}
          onRemove={access.removeRole}
          onClose={() => setRemovedRow(null)}
        />
      )}
    </div>
  );
};

export default AccessTab;
