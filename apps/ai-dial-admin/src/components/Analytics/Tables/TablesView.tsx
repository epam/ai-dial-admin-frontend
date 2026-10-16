'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { ColDef, ICellRendererParams } from 'ag-grid-community';
import {
  Button,
  ButtonDropdown,
  ButtonVariant,
  ConfirmationPopupVariant,
  DialConfirmationPopup,
  DialEllipsisTooltip,
  DropdownItem,
} from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';

import { deleteTable, getTable, getTables, listTableBackfillRuns, updateTable } from '@/src/app/[lang]/tables/actions';
import BackfillDrawer from '@/src/components/Analytics/Common/BackfillSidebar/BackfillDrawer';
import IdentityTag from '@/src/components/Analytics/Common/IdentityTag';
import TableBackfillBanner from '@/src/components/Analytics/Tables/Backfill/TableBackfillBanner';
import TableBackfillSidebar from '@/src/components/Analytics/Tables/Backfill/TableBackfillSidebar';
import { findRunningTableBackfill } from '@/src/components/Analytics/Tables/Backfill/use-table-backfill-runs';
import CreateTablePopup from '@/src/components/Analytics/Tables/CreateTablePopup';
import EditTableMetadataPopup from '@/src/components/Analytics/Tables/EditTableMetadataPopup';
import RowsRestrictedBadge from '@/src/components/Analytics/Tables/RowsRestrictedBadge';
import TableStatusBadge from '@/src/components/Analytics/Tables/TableStatusBadge';
import { TABLE_TYPE_LABEL } from '@/src/components/Analytics/Tables/constants';
import { tableDetailHref } from '@/src/components/Analytics/Tables/utils';
import { navigateEntityUrl } from '@/src/components/EntityListView/utils/on-cell-clicked';
import GridView from '@/src/components/Grid/GridView/GridView';
import { useAppContext } from '@/src/context/AppContext';
import { useAnalyticsTablePermissions } from '@/src/hooks/use-analytics-table-permissions';
import { usePolledRead } from '@/src/hooks/use-polled-read';
import { ACTION_COLUMN, ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { getDeleteOperation, getEditOperation } from '@/src/constants/grid-columns/actions';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { BACKFILL_POLL_INTERVAL_MS } from '@/src/constants/analytics/backfill';
import { AnalyticsTablesI18nKey, BackfillI18nKey, ButtonsI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';
import { AnalyticsTable, AnalyticsTableType, UpdateTableDto } from '@/src/models/analytics/table';
import { TableBackfillRun, TableBackfillState } from '@/src/models/analytics/table-backfill';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';

interface Props {
  initialTables: AnalyticsTable[];
}

const TablesView: FC<Props> = ({ initialTables }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const { canCreate, canDelete } = useAnalyticsTablePermissions();
  const { isEnableAuth, isFullAdmin } = useAppContext();

  const [tables, setTables] = useState<AnalyticsTable[]>(initialTables);
  const [createType, setCreateType] = useState<AnalyticsTableType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<AnalyticsTable | null>(null);
  const [runningBackfill, setRunningBackfill] = useState<TableBackfillRun | null>(null);
  const [isBackfillOpen, setIsBackfillOpen] = useState(false);

  const createItems: DropdownItem[] = useMemo(
    () => [
      {
        key: AnalyticsTableType.Source,
        label: t(AnalyticsTablesI18nKey.TypeSource),
        onClick: () => setCreateType(AnalyticsTableType.Source),
      },
      {
        key: AnalyticsTableType.Enrichment,
        label: t(AnalyticsTablesI18nKey.TypeEnrichment),
        onClick: () => setCreateType(AnalyticsTableType.Enrichment),
      },
    ],
    [t],
  );

  const reload = useCallback(async () => {
    const read = await getTables();
    if (read.success) {
      setTables(read.response ?? []);
      return;
    }
    showNotification(
      getErrorNotification(
        read.errorHeader ?? t(AnalyticsTablesI18nKey.TablesLoadFailed),
        read.errorMessage,
        read.requestId,
      ),
    );
  }, [showNotification, t]);

  // The banner knows only whether a run is in progress, so it asks for running runs alone. While the drawer
  // is open its content reads the whole list and hands every answer back, and this stays quiet.
  const onBackfillRunsChange = useCallback((runs: TableBackfillRun[]) => {
    setRunningBackfill(findRunningTableBackfill(runs) ?? null);
  }, []);

  useEffect(() => {
    if (!isFullAdmin) return;

    void (async () => {
      const read = await listTableBackfillRuns(TableBackfillState.Running);
      if (read.success) setRunningBackfill(read.response?.[0] ?? null);
    })();
  }, [isFullAdmin]);

  const readRunningBackfill = useCallback(async () => {
    const read = await listTableBackfillRuns(TableBackfillState.Running);

    return read.success ? (read.response ?? []) : null;
  }, []);

  usePolledRead({
    read: readRunningBackfill,
    onResult: onBackfillRunsChange,
    isTerminal: (runs) => runs.length === 0,
    intervalMs: BACKFILL_POLL_INTERVAL_MS,
    isEnabled: Boolean(runningBackfill) && !isBackfillOpen,
  });

  const onOpenBackfill = useCallback(() => setIsBackfillOpen(true), []);
  const onCloseBackfill = useCallback(() => setIsBackfillOpen(false), []);

  const onConfirmDelete = async () => {
    if (!deleteTarget) return;
    const name = deleteTarget;
    setDeleteTarget(null);
    const res = await deleteTable(name);
    if (res.success) {
      showNotification(getSuccessNotification(t(AnalyticsTablesI18nKey.Deleted)));
      void reload();
    } else {
      showNotification(
        getErrorNotification(
          res.errorHeader || t(AnalyticsTablesI18nKey.ActionFailed),
          res.errorMessage,
          res.requestId,
        ),
      );
    }
  };

  // The edit popup needs `columns` to derive the table's distinct tags for reordering — fetch the full
  // definition before opening it.
  const onOpenEdit = async (tbl?: AnalyticsTable) => {
    if (!tbl) return;
    const full = await getTable(tbl.name);
    if (full.response) setEditTarget(full.response);
  };

  const onSubmitEditMetadata = async (dto: UpdateTableDto) => {
    if (!editTarget) return;
    const res = await updateTable(editTarget.name, dto);
    if (res.success) {
      showNotification(getSuccessNotification(t(AnalyticsTablesI18nKey.TableUpdated)));
      setEditTarget(null);
      void reload();
    } else {
      showNotification(
        getErrorNotification(
          res.errorHeader || t(AnalyticsTablesI18nKey.ActionFailed),
          res.errorMessage,
          res.requestId,
        ),
      );
    }
  };

  // Edit (description/tag_order) is authorizable by a per-table `modify` role, not just FULL_ADMIN, so
  // its visibility is checked per row against that row's own reported permissions — unlike Delete, which
  // the backend never authorizes via an access role and stays FULL_ADMIN-only (`canDelete`).
  const rowActions: ActionMenuOperationDeclaration<AnalyticsTable>[] = useMemo(
    () => [
      getEditOperation<AnalyticsTable>(
        (tbl) => void onOpenEdit(tbl),
        (_api, node) => {
          const tbl = node.data as AnalyticsTable | undefined;
          return Boolean(tbl?.system) || !(tbl?.permissions?.modify ?? !isEnableAuth);
        },
      ),
      getDeleteOperation<AnalyticsTable>(
        (tbl) => tbl && setDeleteTarget(tbl.name),
        (_api, node) => Boolean((node.data as AnalyticsTable | undefined)?.system) || !canDelete,
      ),
    ],
    [canDelete, isEnableAuth],
  );

  const columns: ColDef[] = useMemo(
    () => [
      {
        headerName: t(AnalyticsTablesI18nKey.Name),
        field: 'name',
        flex: 2,
        cellRenderer: ({ data }: ICellRendererParams<AnalyticsTable>) =>
          data && (
            <span className="flex items-center gap-2">
              <span className="truncate">{data.name}</span>
              {data.permissions?.rows_restricted && <RowsRestrictedBadge />}
            </span>
          ),
      },
      {
        headerName: t(AnalyticsTablesI18nKey.Type),
        field: 'type',
        flex: 1,
        cellRenderer: ({ data }: ICellRendererParams<AnalyticsTable>) =>
          data?.type ? <IdentityTag label={t(TABLE_TYPE_LABEL[data.type])} /> : null,
        // The tag already says it; the default tooltip would repeat the raw value over it.
        tooltipValueGetter: () => undefined,
      },
      // Populated for an enrichment only; a source table enriches nothing, so its cell stays blank.
      { headerName: t(AnalyticsTablesI18nKey.SourceTable), field: 'source_table', flex: 2 },
      { headerName: t(AnalyticsTablesI18nKey.Description), field: 'description', flex: 3 },
      {
        headerName: t(AnalyticsTablesI18nKey.ColumnsCount),
        colId: 'columnsCount',
        flex: 1,
        valueGetter: (params) => (params.data as AnalyticsTable | undefined)?.column_count ?? 0,
      },
      {
        headerName: t(AnalyticsTablesI18nKey.Status),
        colId: 'status',
        flex: 1,
        cellDataType: false,
        cellRenderer: ({ data }: ICellRendererParams<AnalyticsTable>) => <TableStatusBadge status={data?.status} />,
      },
      {
        headerName: t(AnalyticsTablesI18nKey.System),
        colId: 'system',
        flex: 1,
        valueGetter: (params) =>
          (params.data as AnalyticsTable | undefined)?.system ? t(AnalyticsTablesI18nKey.System) : '',
        cellRenderer: ({ value }: ICellRendererParams<AnalyticsTable, string>) =>
          value ? <IdentityTag label={value} /> : null,
        tooltipValueGetter: () => undefined,
      },
      ACTION_COLUMN(rowActions),
    ],
    [t, rowActions],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 relative">
      <div className="flex flex-row mb-8 justify-between items-center gap-4 h-[40px]">
        <h1>{t(MenuI18nKey.Tables)}</h1>
        <div className="flex items-center gap-4">
          {isFullAdmin && !runningBackfill && (
            <Button variant={ButtonVariant.Neutral} label={t(BackfillI18nKey.TableTitle)} onClick={onOpenBackfill} />
          )}
          {canCreate && (
            <ButtonDropdown
              variant={ButtonVariant.Primary}
              label={t(ButtonsI18nKey.Create)}
              iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
              items={createItems}
            />
          )}
        </div>
      </div>

      {isFullAdmin && runningBackfill && (
        <div className="mb-4">
          <TableBackfillBanner run={runningBackfill} onOpen={onOpenBackfill} />
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col">
        <GridView
          columnDefs={columns}
          rowData={tables}
          getRowId={(params) => params.data.name}
          additionalGridOptions={{
            onCellClicked: (e) => {
              if (e.colDef.field === ACTIONS_COLUMN_CEL_ID || !e.data) return;
              navigateEntityUrl(tableDetailHref(e.data.name), router.push, e.event as MouseEvent | undefined);
            },
          }}
          emptyDataProps={{ title: t(AnalyticsTablesI18nKey.NoTables) }}
        />
      </div>

      {deleteTarget && (
        <DialConfirmationPopup
          open={!!deleteTarget}
          variant={ConfirmationPopupVariant.Danger}
          header={t(AnalyticsTablesI18nKey.DeleteConfirmTitle)}
          description={
            <div className="flex flex-col gap-y-2">
              <span>{t(AnalyticsTablesI18nKey.DeleteConfirmDescription)}</span>
              <div className="flex flex-row items-center gap-x-1 text-primary dial-small">
                <span className="text-secondary shrink-0">{t(AnalyticsTablesI18nKey.Name)}:</span>
                <DialEllipsisTooltip text={deleteTarget} />
              </div>
            </div>
          }
          confirmLabel={t(AnalyticsTablesI18nKey.DeleteTable)}
          onConfirm={() => void onConfirmDelete()}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      <BackfillDrawer isOpen={isBackfillOpen} onClose={onCloseBackfill} title={t(BackfillI18nKey.TableTitle)}>
        <TableBackfillSidebar onRunsChange={onBackfillRunsChange} />
      </BackfillDrawer>

      {createType !== null && (
        <CreateTablePopup
          tableType={createType}
          tables={tables}
          onClose={() => setCreateType(null)}
          onCreated={() => void reload()}
        />
      )}

      {editTarget && (
        <EditTableMetadataPopup
          table={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={(dto) => void onSubmitEditMetadata(dto)}
        />
      )}
    </div>
  );
};

export default TablesView;
