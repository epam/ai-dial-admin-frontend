'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { ColDef, ICellRendererParams, ITooltipParams, ValueGetterParams } from 'ag-grid-community';
import {
  ConfirmationPopupVariant,
  DialConfirmationPopup,
  DialDangerButton,
  DialFormPopup,
  DialNeutralButton,
  DialPrimaryButton,
  PopupSize,
} from '@epam/ai-dial-ui-kit';

import { addRows, defineTableSchema, deleteTable, getTable, updateTableSchema } from '@/src/app/[lang]/tables/actions';
import ColumnRowsEditor from '@/src/components/Analytics/Tables/ColumnRowsEditor';
import DraftSchemaEditor from '@/src/components/Analytics/Tables/DraftSchemaEditor';
import EditColumnPopup from '@/src/components/Analytics/Tables/EditColumnPopup';
import TableAccessPanel from '@/src/components/Analytics/Tables/TableAccessPanel';
import TableStatusBadge from '@/src/components/Analytics/Tables/TableStatusBadge';
import { useDraftSchemaForm } from '@/src/components/Analytics/Tables/use-draft-schema-form';
import {
  createColumnRow,
  getColumnRowErrors,
  hasColumnRowErrors,
  isRenameRestricted,
  toTableColumns,
} from '@/src/components/Analytics/Tables/utils';
import { TypeCellRenderer } from '@/src/components/Analytics/Common/TypeBadge';
import SensitiveIndicator from '@/src/components/Common/SensitiveIndicator/SensitiveIndicator';
import GridView from '@/src/components/Grid/GridView/GridView';
import JsonEditorBase from '@/src/components/Common/JsonEditorBase/JsonEditorBase';
import { useAnalyticsTablePermissions } from '@/src/hooks/use-analytics-table-permissions';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getDeleteOperation, getEditOperation } from '@/src/constants/grid-columns/actions';
import { AnalyticsTablesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';
import {
  AnalyticsSchemaPatch,
  AnalyticsTable,
  AnalyticsTableColumn,
  AnalyticsTableType,
  DraftSchemaDto,
  TableStatus,
} from '@/src/models/analytics/table';
import { ColumnRow } from '@/src/models/analytics/tables-ui';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { getAnalyticsIdentifierError } from '@/src/utils/validation/analytics-table-error';
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
  const [accessOpen, setAccessOpen] = useState(false);
  const [addColumns, setAddColumns] = useState<ColumnRow[]>([createColumnRow()]);
  const [rowsJson, setRowsJson] = useState('[]');
  const [editColumn, setEditColumn] = useState<AnalyticsTableColumn | null>(null);
  const [sourceTable, setSourceTable] = useState<AnalyticsTable | null>(null);

  const isSystem = Boolean(table.system);
  const isActive = table.status === TableStatus.Active;
  const { canDelete, canWrite, canModify, canManageRoles } = useAnalyticsTablePermissions(table);
  const columns = useMemo(() => table.columns ?? [], [table.columns]);

  const draft = useDraftSchemaForm(table, sourceTable, t);

  // An enrichment's draft grain-key options are the referenced source's declared columns; fetch it
  // only while drafting (the live grain key is fixed and shown via `table.grain` instead).
  useEffect(() => {
    if (isActive || table.type !== AnalyticsTableType.Enrichment || !table.source_table) {
      setSourceTable(null);
      return;
    }
    let cancelled = false;
    void getTable(table.source_table).then((tbl) => {
      if (!cancelled) setSourceTable(tbl);
    });
    return () => {
      cancelled = true;
    };
  }, [isActive, table.type, table.source_table]);

  // New columns must not collide with the table's existing source/exposed names (the backend rejects
  // duplicates); validate the add-columns rows against them plus each other.
  const addColumnErrors = getColumnRowErrors(
    addColumns,
    { sourceNames: columns.map((c) => c.source_name), names: columns.map((c) => c.name) },
    t,
  );

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

  const onDefineSchema = useCallback(
    async (dto: DraftSchemaDto): Promise<boolean> => {
      const res = await defineTableSchema(name, dto);
      if (res.success) {
        showNotification(getSuccessNotification(t(AnalyticsTablesI18nKey.TableActive)));
        await reload();
        return true;
      }
      notifyFailed(res);
      return false;
    },
    [name, reload, notifyFailed, showNotification, t],
  );

  const onSubmitDefineSchema = () => {
    if (draft.canMaterialize) void onDefineSchema(draft.buildDto());
  };

  const onDrop = useCallback(
    (column?: AnalyticsTableColumn) => column && void applyPatch({ drop: [column.name] }),
    [applyPatch],
  );

  const onRenameCell = useCallback(
    (from: string, to: string) => {
      const target = to.trim();
      if (!target || target === from) return;
      // Validate the new name against the grammar and the other columns' names; on failure notify and
      // reload so the inline-edited grid cell reverts to its previous value.
      const others = columns.filter((c) => c.name !== from).map((c) => c.name);
      const error = getAnalyticsIdentifierError(target, others, t);
      if (error) {
        showNotification(getErrorNotification(error.text));
        void reload();
        return;
      }
      void applyPatch({ rename: [{ from, to: target }] });
    },
    [applyPatch, columns, reload, showNotification, t],
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
        editable: canModify,
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
      ...(canModify ? [ACTION_COLUMN(actions)] : []),
    ],
    [t, actions, canModify],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 relative">
      <div className="flex flex-row mb-8 justify-between items-center gap-4 h-[40px]">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate">{name}</h1>
          <TableStatusBadge status={table.status} />
          {isSystem && (
            <span className="shrink-0 rounded bg-layer-4 px-2 py-0.5 uppercase text-secondary dial-tiny-text">
              {t(AnalyticsTablesI18nKey.SystemReadOnly)}
            </span>
          )}
        </div>
        {(canDelete || canWrite || canModify || canManageRoles) && (
          <div className="flex items-center gap-4">
            {canManageRoles && (
              <DialNeutralButton label={t(AnalyticsTablesI18nKey.ManageAccess)} onClick={() => setAccessOpen(true)} />
            )}
            {isActive ? (
              <>
                {canModify && (
                  <DialNeutralButton label={t(AnalyticsTablesI18nKey.AddColumns)} onClick={() => setAddOpen(true)} />
                )}
                {canWrite && (
                  <DialNeutralButton label={t(AnalyticsTablesI18nKey.WriteRows)} onClick={() => setWriteOpen(true)} />
                )}
              </>
            ) : (
              canModify && (
                <DialPrimaryButton
                  label={t(ButtonsI18nKey.Save)}
                  disabled={!draft.canMaterialize}
                  onClick={onSubmitDefineSchema}
                />
              )
            )}
            {canDelete && (
              <DialDangerButton label={t(AnalyticsTablesI18nKey.DeleteTable)} onClick={() => setConfirmOpen(true)} />
            )}
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-auto">
        {isActive ? (
          <GridView
            columnDefs={columnDefs}
            rowData={columns}
            getRowId={(params) => params.data.name}
            additionalGridOptions={{
              onCellValueChanged: (e) => {
                if (e.colDef.field === 'name') onRenameCell(e.oldValue as string, e.newValue as string);
              },
            }}
            emptyDataProps={{ title: t(AnalyticsTablesI18nKey.NoColumns) }}
          />
        ) : (
          <DraftSchemaEditor table={table} draft={draft} />
        )}
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
          disableSubmitButton={toTableColumns(addColumns).length === 0 || hasColumnRowErrors(addColumnErrors)}
          onClose={() => setAddOpen(false)}
          onSubmit={() => void onSubmitAddColumns()}
        >
          <div className="max-h-[70vh] overflow-auto p-6">
            <ColumnRowsEditor rows={addColumns} errors={addColumnErrors} onChange={setAddColumns} />
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
          existingNames={columns.filter((c) => c.name !== editColumn.name).map((c) => c.name)}
          onClose={() => setEditColumn(null)}
          onSubmit={(patch) => void onSubmitEditColumn(patch)}
        />
      )}

      {accessOpen && <TableAccessPanel name={name} onClose={() => setAccessOpen(false)} />}
    </div>
  );
};

export default TableDetailView;
