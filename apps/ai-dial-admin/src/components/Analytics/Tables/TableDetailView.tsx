'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { ColDef, ICellRendererParams, ITooltipParams, ValueGetterParams } from 'ag-grid-community';
import {
  ConfirmationPopupVariant,
  DialConfirmationPopup,
  DialDangerButton,
  DialFormPopup,
  DialNeutralButton,
  PopupSize,
} from '@epam/ai-dial-ui-kit';

import { addRows, deleteTable, getTable, updateTableSchema } from '@/src/app/[lang]/tables/actions';
import ColumnRowsEditor from '@/src/components/Analytics/Tables/ColumnRowsEditor';
import EditColumnPopup from '@/src/components/Analytics/Tables/EditColumnPopup';
import { createColumnRow, isRenameRestricted, toTableColumns } from '@/src/components/Analytics/Tables/utils';
import { TypeCellRenderer } from '@/src/components/Analytics/Common/TypeBadge';
import SensitiveIndicator from '@/src/components/Common/SensitiveIndicator/SensitiveIndicator';
import GridView from '@/src/components/Grid/GridView/GridView';
import JsonEditorBase from '@/src/components/Common/JsonEditorBase/JsonEditorBase';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getDeleteOperation, getEditOperation } from '@/src/constants/grid-columns/actions';
import { AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';
import { AnalyticsSchemaPatch, AnalyticsTable, AnalyticsTableColumn } from '@/src/models/analytics/table';
import { ColumnRow } from '@/src/models/analytics/tables-ui';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';

interface Props {
  name: string;
  initialTable: AnalyticsTable;
}

// Renders the column name with a trailing sensitive marker; editing still swaps in the cell editor.
// The dot is tooltip-less — the grid's cell tooltip (see the name column's tooltipValueGetter) carries
// the sensitive note, so the two don't double up.
const ColumnNameCellRenderer: FC<ICellRendererParams<AnalyticsTableColumn>> = ({ value, data }) => (
  <span className="flex items-center gap-1.5">
    <span className="truncate">{value}</span>
    {data?.sensitive && <SensitiveIndicator />}
  </span>
);

const TableDetailView: FC<Props> = ({ name, initialTable }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();

  const [table, setTable] = useState<AnalyticsTable>(initialTable);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [writeOpen, setWriteOpen] = useState(false);
  const [addColumns, setAddColumns] = useState<ColumnRow[]>([createColumnRow()]);
  const [rowsJson, setRowsJson] = useState('[]');
  const [editColumn, setEditColumn] = useState<AnalyticsTableColumn | null>(null);

  const isSystem = Boolean(table.system);

  const reload = useCallback(async () => {
    const tbl = await getTable(name);
    if (tbl) setTable(tbl);
  }, [name]);

  const goToCatalog = () => router.push(ApplicationRoute.AnalyticsTables);

  const notifyFailed = useCallback(
    (res: ServerActionResponse) =>
      showNotification(
        getErrorNotification(
          res.errorHeader || t(AnalyticsTablesI18nKey.ActionFailed),
          res.errorMessage,
          res.requestId,
        ),
      ),
    [showNotification, t],
  );

  const applyPatch = useCallback(
    async (patch: AnalyticsSchemaPatch): Promise<boolean> => {
      const res = await updateTableSchema(name, patch);
      if (res.success) {
        showNotification(getSuccessNotification(t(AnalyticsTablesI18nKey.SchemaUpdated)));
        await reload();
        return true;
      }
      notifyFailed(res);
      return false;
    },
    [name, reload, notifyFailed, showNotification, t],
  );

  const onDrop = useCallback(
    (column?: AnalyticsTableColumn) => column && void applyPatch({ drop: [column.name] }),
    [applyPatch],
  );

  const onRenameCell = useCallback(
    (from: string, to: string) => {
      const target = to.trim();
      if (target && target !== from) void applyPatch({ rename: [{ from, to: target }] });
    },
    [applyPatch],
  );

  const onSubmitEditColumn = async (patch: AnalyticsSchemaPatch) => {
    if (await applyPatch(patch)) setEditColumn(null);
  };

  const onSubmitAddColumns = async () => {
    const cols = toTableColumns(addColumns);
    if (!cols.length) return;
    if (await applyPatch({ add: cols })) {
      setAddColumns([createColumnRow()]);
      setAddOpen(false);
    }
  };

  const onSubmitWriteRows = async () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rowsJson);
    } catch {
      showNotification(getErrorNotification(t(AnalyticsTablesI18nKey.InvalidRowsJson)));
      return;
    }
    if (!Array.isArray(parsed)) {
      showNotification(getErrorNotification(t(AnalyticsTablesI18nKey.InvalidRowsJson)));
      return;
    }
    const res = await addRows(name, { rows: parsed as Record<string, unknown>[] });
    if (res.success) {
      showNotification(getSuccessNotification(t(AnalyticsTablesI18nKey.RowsInserted)));
      setWriteOpen(false);
    } else {
      notifyFailed(res);
    }
  };

  const onConfirmDelete = async () => {
    setConfirmOpen(false);
    const res = await deleteTable(name);
    if (res.success) {
      showNotification(getSuccessNotification(t(AnalyticsTablesI18nKey.Deleted)));
      goToCatalog();
    } else {
      notifyFailed(res);
    }
  };

  const actions = useMemo<ActionMenuOperationDeclaration<AnalyticsTableColumn>[]>(
    () => [
      getEditOperation<AnalyticsTableColumn>((column) => column && setEditColumn(column)),
      getDeleteOperation<AnalyticsTableColumn>((column) => onDrop(column)),
    ],
    [onDrop],
  );

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: t(AnalyticsTablesI18nKey.ColumnName),
        field: 'name',
        editable: !isSystem,
        cellRenderer: ColumnNameCellRenderer,
        // Fold the sensitive note into the single cell tooltip so it doesn't double with the dot.
        tooltipValueGetter: (params: ITooltipParams<AnalyticsTableColumn>) =>
          [params.data?.name, params.data?.sensitive ? t(AnalyticsTablesI18nKey.Sensitive) : '']
            .filter(Boolean)
            .join(' — '),
        flex: 2,
      },
      { headerName: t(AnalyticsTablesI18nKey.SourceName), field: 'source_name', flex: 2 },
      { headerName: t(AnalyticsTablesI18nKey.Type), field: 'type', cellRenderer: TypeCellRenderer, flex: 1 },
      { headerName: t(AnalyticsTablesI18nKey.Tag), field: 'tag', flex: 1 },
      // Long display names/descriptions truncate in the cell; the grid's default tooltip exposes the full value.
      { headerName: t(AnalyticsTablesI18nKey.DisplayName), field: 'display_name', flex: 2 },
      { headerName: t(AnalyticsTablesI18nKey.Description), field: 'description', flex: 3 },
      {
        headerName: t(AnalyticsTablesI18nKey.Nullable),
        colId: 'nullable',
        flex: 1,
        cellDataType: false,
        valueGetter: (params: ValueGetterParams<AnalyticsTableColumn>) => String(Boolean(params.data?.nullable)),
      },
      ...(isSystem ? [] : [ACTION_COLUMN(actions)]),
    ],
    [t, actions, isSystem],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 relative">
      <div className="flex flex-row mb-8 justify-between items-center gap-4 h-[40px]">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate">{name}</h1>
          {isSystem && (
            <span className="shrink-0 rounded bg-layer-4 px-2 py-0.5 uppercase text-secondary dial-tiny-text">
              {t(AnalyticsTablesI18nKey.SystemReadOnly)}
            </span>
          )}
        </div>
        {!isSystem && (
          <div className="flex items-center gap-4">
            <DialDangerButton label={t(AnalyticsTablesI18nKey.DeleteTable)} onClick={() => setConfirmOpen(true)} />
            <DialNeutralButton label={t(AnalyticsTablesI18nKey.WriteRows)} onClick={() => setWriteOpen(true)} />
            <DialNeutralButton label={t(AnalyticsTablesI18nKey.AddColumns)} onClick={() => setAddOpen(true)} />
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <GridView
          columnDefs={columnDefs}
          rowData={table.columns ?? []}
          getRowId={(params) => params.data.name}
          additionalGridOptions={{
            onCellValueChanged: (e) => {
              if (e.colDef.field === 'name') onRenameCell(e.oldValue as string, e.newValue as string);
            },
          }}
          emptyDataProps={{ title: t(AnalyticsTablesI18nKey.NoColumns) }}
        />
      </div>

      {confirmOpen && (
        <DialConfirmationPopup
          open={confirmOpen}
          variant={ConfirmationPopupVariant.Danger}
          header={t(AnalyticsTablesI18nKey.DeleteConfirmTitle)}
          description={t(AnalyticsTablesI18nKey.DeleteConfirmDescription)}
          confirmLabel={t(AnalyticsTablesI18nKey.DeleteTable)}
          onConfirm={() => void onConfirmDelete()}
          onClose={() => setConfirmOpen(false)}
        />
      )}

      {addOpen && (
        <DialFormPopup
          open={addOpen}
          portalId="qb-add-columns"
          size={PopupSize.Lg}
          header={t(AnalyticsTablesI18nKey.AddColumns)}
          submitLabel={t(AnalyticsTablesI18nKey.AddColumns)}
          disableSubmitButton={toTableColumns(addColumns).length === 0}
          onClose={() => setAddOpen(false)}
          onSubmit={() => void onSubmitAddColumns()}
        >
          <div className="max-h-[70vh] overflow-auto p-6">
            <ColumnRowsEditor rows={addColumns} onChange={setAddColumns} />
          </div>
        </DialFormPopup>
      )}

      {writeOpen && (
        <DialFormPopup
          open={writeOpen}
          portalId="qb-write-rows"
          size={PopupSize.Lg}
          header={t(AnalyticsTablesI18nKey.WriteRows)}
          submitLabel={t(AnalyticsTablesI18nKey.InsertRows)}
          onClose={() => setWriteOpen(false)}
          onSubmit={() => void onSubmitWriteRows()}
        >
          <div className="p-6">
            <div className="h-[320px] overflow-hidden rounded border border-primary">
              <JsonEditorBase value={rowsJson} onChange={(v) => setRowsJson(v ?? '')} />
            </div>
          </div>
        </DialFormPopup>
      )}

      {editColumn && (
        <EditColumnPopup
          column={editColumn}
          renameDisabled={isRenameRestricted(table, editColumn)}
          onClose={() => setEditColumn(null)}
          onSubmit={(patch) => void onSubmitEditColumn(patch)}
        />
      )}
    </div>
  );
};

export default TableDetailView;
