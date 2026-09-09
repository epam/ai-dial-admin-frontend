'use client';

import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { GridApi, IRowNode } from 'ag-grid-community';
import {
  ConfirmationPopupVariant,
  DialConfirmationPopup,
  DialDangerButton,
  DialEllipsisTooltip,
  DialFormPopup,
  DialGhostButton,
  DialNeutralButton,
  DialPrimaryButton,
  DialTabs,
  PopupSize,
} from '@epam/ai-dial-ui-kit';
import { IconPlugConnected } from '@tabler/icons-react';

import {
  addRows,
  defineTableSchema,
  deleteTable,
  getTable,
  updateTable,
  updateTableSchema,
} from '@/src/app/[lang]/tables/actions';
import ColumnRowsEditor from '@/src/components/Analytics/Tables/ColumnRowsEditor';
import ConnectPanel from '@/src/components/Analytics/Tables/ConnectPanel/ConnectPanel';
import { isEnrichmentRead } from '@/src/components/Analytics/Tables/ConnectPanel/connect-snippets';
import { buildDraftDocument, splitDraftDocument } from '@/src/components/Analytics/Tables/draft-document';
import EditColumnPopup from '@/src/components/Analytics/Tables/EditColumnPopup';
import TableAccessPanel from '@/src/components/Analytics/Tables/TableAccessPanel';
import TableAudit from '@/src/components/Analytics/Tables/TableAudit';
import TableProperties from '@/src/components/Analytics/Tables/TableProperties';
import TableStatusBadge from '@/src/components/Analytics/Tables/TableStatusBadge';
import { useDraftSchemaForm } from '@/src/components/Analytics/Tables/use-draft-schema-form';
import {
  buildRowsTemplate,
  createColumnRow,
  getColumnRowErrors,
  hasColumnRowErrors,
  isRenameRestricted,
  isScanMetadataColumn,
  parseRowsJson,
  toTableColumns,
} from '@/src/components/Analytics/Tables/utils';
import JsonEditorBase from '@/src/components/Common/JsonEditorBase/JsonEditorBase';
import { showEditorErrorNotifications } from '@/src/components/EntityHeaderControls/Buttons/utils';
import JsonToggle from '@/src/components/EntityHeaderControls/JsonToggle/JsonToggle';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { useAnalyticsTablePermissions } from '@/src/hooks/use-analytics-table-permissions';
import { getDeleteOperation, getEditOperation } from '@/src/constants/grid-columns/actions';
import { AnalyticsTablesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import {
  AnalyticsSchemaPatch,
  AnalyticsTable,
  AnalyticsTableColumn,
  AnalyticsTableType,
  DraftSchemaDto,
  DraftTableDocument,
  TableStatus,
} from '@/src/models/analytics/table';
import { ColumnRow } from '@/src/models/analytics/tables-ui';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { auditTab, EntityViewTab, propertiesTab } from '@/src/utils/tabs/utils';
import { getAnalyticsIdentifierError } from '@/src/utils/validation/analytics-table-error';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';

interface Props {
  name: string;
  initialTable: AnalyticsTable;
  // The endpoints an external client would call, from ANALYTICS_PUBLIC_URL and
  // ANALYTICS_FLIGHT_SQL_PUBLIC_URL; blank when unconfigured, which makes the generated snippets fall
  // back to a visible placeholder.
  apiBaseUrl: string;
  flightUri: string;
}

// The grain-key row is pinned to the grid's top (see `grainKeyRow` below) rather than a real editable
// column, so its inline rename and row actions are disabled wherever this check is used.
const isPinnedRow = (_api: GridApi, node: IRowNode) => Boolean(node.rowPinned);

const TableDetailView: FC<Props> = ({ name, initialTable, apiBaseUrl, flightUri }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  // `/tables/[id]` has no feature-flag guard, so a bookmarked link reaches this view on an install with
  // analytics off. Gating the tab strip here is what keeps the Audit tab — and its activity request —
  // out of that install.
  const { featureFlags } = useAppContext();
  const { dispatch, jsonErrors } = useSaveValidationContext();

  const [table, setTable] = useState<AnalyticsTable>(initialTable);
  const [activeTab, setActiveTab] = useState<EntityViewTab>(EntityViewTab.Properties);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [writeOpen, setWriteOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [addColumns, setAddColumns] = useState<ColumnRow[]>([createColumnRow()]);
  const [rowsJson, setRowsJson] = useState('[]');
  const [editColumn, setEditColumn] = useState<AnalyticsTableColumn | null>(null);
  const [sourceTable, setSourceTable] = useState<AnalyticsTable | null>(null);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  const [draftDocument, setDraftDocument] = useState<DraftTableDocument | null>(null);

  const isSystem = Boolean(table.system);
  // An enrichment's rows come from the enrichment process, so the write half of Connect never applies
  // to one. The read half does: its columns are queryable as table-qualified fields on its source
  // table, which is why Connect needs that table to be named before it can offer anything.
  const isEnrichment = table.type === AnalyticsTableType.Enrichment;
  const canConnect = !isEnrichment || isEnrichmentRead(table);
  const isActive = table.status === TableStatus.Active;
  const { canDelete, canWrite, canModify, canManageRoles } = useAnalyticsTablePermissions(table);
  const columns = useMemo(() => table.columns ?? [], [table.columns]);

  const draft = useDraftSchemaForm(table, sourceTable, t);

  // An enrichment's grain key is a column on its source table (draft: populates grain-key options;
  // active: backfills the pinned grain-key row's type/tag/display metadata, which the enrichment table's
  // own API response never exposes for that hidden column — see grainKeyRow below).
  useEffect(() => {
    if (table.type !== AnalyticsTableType.Enrichment || !table.source_table) {
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
  }, [table.type, table.source_table]);

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

  // The document carries catalog metadata the schema endpoint does not accept, so a save from the
  // editor is two requests in order: the metadata merge-patch first, and the schema only if it
  // succeeded — a schema call materializes the table, after which the metadata could still be edited
  // from the catalog, but a metadata failure hidden behind a materialized table could not.
  const onSubmitDocument = async (document: DraftTableDocument) => {
    const { update, schema } = splitDraftDocument(document);
    const res = await updateTable(name, update);
    if (!res.success) {
      notifyFailed(res);
      return;
    }
    await onDefineSchema(schema);
  };

  // Editor mode's only client-side gate is that the document parses: EntityJsonEditor forwards a
  // successful parse only, so with markers present the stored document is the last good one and an
  // ungated save would send stale content.
  const onTryToSave = () => {
    if (!isEditorEnabled) {
      onSubmitDefineSchema();
      return;
    }
    if (jsonErrors?.length) {
      const errorNotifications = showEditorErrorNotifications(jsonErrors, showNotification, t);
      dispatch({ type: ValidationActionType.SetJsonEditorNotifications, errors: errorNotifications });
      return;
    }
    if (draftDocument) void onSubmitDocument(draftDocument);
  };

  // Seeded on the first entry only. The document is the sole holder of hand-authored JSON — the column
  // form cannot represent `description`, `tag_order` or a pasted pass-through member — so re-seeding on
  // a later entry would silently discard it.
  const onToggleEditor = () => {
    if (!draftDocument) setDraftDocument(buildDraftDocument(table, draft.buildDto()));
    setIsEditorEnabled((prev) => !prev);
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
    const parsed = parseRowsJson(rowsJson);
    if (!parsed) {
      showNotification(getErrorNotification(t(AnalyticsTablesI18nKey.InvalidRowsJson)));
      return;
    }
    const res = await addRows(name, { rows: parsed });
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

  const onAddRows = () => {
    setRowsJson(buildRowsTemplate(columns, table.grain?.grain_key));
    setWriteOpen(true);
  };
  // The manual editor is a hand-check; a reader who opened it for real ingestion is redirected to the
  // scripted path before typing, so the discarded content is the untouched template.
  const onWriteProgrammatically = () => {
    setWriteOpen(false);
    setConnectOpen(true);
  };
  // The enrichment grain key is a hidden physical column (never part of `table.columns`, and the API
  // never exposes its type/tag/display metadata directly) — shown pinned to the top of the grid for
  // visibility, but it isn't a real editable column: it can't be renamed or dropped here. The backend
  // creates it with the same name and type as the matching column on the source table, so we backfill
  // its metadata from there; a source column later renamed/dropped just falls back to a bare name row.
  const grainKeyRow = useMemo<AnalyticsTableColumn | null>(() => {
    if (table.type !== AnalyticsTableType.Enrichment || !table.grain?.grain_key) return null;
    const grainKey = table.grain.grain_key;
    const sourceColumn = sourceTable?.columns?.find((c) => c.source_name === grainKey);
    return sourceColumn
      ? { ...sourceColumn, source_name: grainKey, name: grainKey }
      : { source_name: grainKey, name: grainKey, type: '' as AnalyticsFieldType };
  }, [table.type, table.grain, sourceTable]);

  const isDropRestricted = useCallback(
    (api: GridApi, node: IRowNode) => {
      if (isPinnedRow(api, node)) return true;
      const column = node.data as AnalyticsTableColumn | undefined;
      if (!column) return false;
      return isScanMetadataColumn(table, column);
    },
    [table],
  );

  const actions = useMemo<ActionMenuOperationDeclaration<AnalyticsTableColumn>[]>(
    () => [
      getEditOperation<AnalyticsTableColumn>((column) => column && setEditColumn(column), isPinnedRow),
      getDeleteOperation<AnalyticsTableColumn>((column) => onDrop(column), isDropRestricted),
    ],
    [onDrop, isDropRestricted],
  );

  // Audit is offered only on an active table: a table that was never materialized has no columns and no
  // recorded activities, so the tab could only ever be empty (design.md D12). FAILED and an unreported
  // status take the same branch as a draft — the branch that already renders the draft schema editor.
  // On an active table it needs no permission the detail view does not already require.
  const tabs = useMemo(() => [propertiesTab(t), auditTab(t)], [t]);

  // `entity` is handed the document object exactly as EntityJsonEditor last produced it, and stored by
  // reference: the component keeps that same object in `lastEntityFromEditorRef` and skips its reseeding
  // effect while `entity` is identical to it. Deriving, cloning or normalizing the object here would make
  // every accepted keystroke a new reference, remounting Monaco and resetting the cursor — jsdom mocks
  // Monaco away, so no test in this repo can catch that (design.md D2).
  const draftEditor = (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      {/* The cast is the shared component's own shape: `entity` is nullable but `setSelectedEntity` is
          not, and the editor only ever calls it with a parsed object, never with an updater. */}
      <EntityJsonEditor
        entity={draftDocument}
        setSelectedEntity={setDraftDocument as Dispatch<SetStateAction<DraftTableDocument>>}
      />
    </div>
  );

  const properties = (
    <TableProperties
      table={table}
      grainKeyRow={grainKeyRow}
      draft={draft}
      actions={actions}
      canModify={canModify}
      onRenameCell={onRenameCell}
    />
  );

  // The two authoring surfaces are mutually exclusive; the editor is reachable only on a draft, so the
  // active table's tabbed body below never sees it.
  const draftSurface = isEditorEnabled ? draftEditor : properties;

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 relative">
      <div className="flex flex-col mb-8 gap-2">
        <div className="flex flex-row justify-between items-center gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate">{name}</h1>
            <TableStatusBadge status={table.status} />
            {/* Neutral chip, not a second colored pill: the kind is a fixed identity fact, unlike the
                status beside it, and the catalog grid is the only other place that states it. */}
            <span className="shrink-0 rounded bg-layer-4 px-2 py-0.5 uppercase text-secondary dial-tiny-text">
              {t(isEnrichment ? AnalyticsTablesI18nKey.TypeEnrichment : AnalyticsTablesI18nKey.TypeSource)}
            </span>
            {isSystem && (
              <span className="shrink-0 rounded bg-layer-4 px-2 py-0.5 uppercase text-secondary dial-tiny-text">
                {t(AnalyticsTablesI18nKey.SystemReadOnly)}
              </span>
            )}
          </div>
          {/* shrink-0 keeps the actions at their natural width, so no description length can squeeze a
              button label onto a second line; the title next to them truncates instead. */}
          {(canDelete || canWrite || canModify || canManageRoles || (isActive && canConnect)) && (
            <div className="flex shrink-0 items-center gap-4">
              {canManageRoles && (
                <DialNeutralButton label={t(AnalyticsTablesI18nKey.ManageAccess)} onClick={() => setAccessOpen(true)} />
              )}
              {canDelete && (
                <DialDangerButton label={t(AnalyticsTablesI18nKey.DeleteTable)} onClick={() => setConfirmOpen(true)} />
              )}
              {isActive ? (
                <>
                  {canModify && (
                    <DialNeutralButton label={t(AnalyticsTablesI18nKey.AddColumns)} onClick={() => setAddOpen(true)} />
                  )}
                  {canWrite && !isEnrichment && (
                    <DialNeutralButton label={t(AnalyticsTablesI18nKey.AddRows)} onClick={onAddRows} />
                  )}
                  {/* Not permission-gated: a reader who cannot yet write is the one who needs to learn
                      which role to ask for. An enrichment gets the read-only panel — see canConnect. */}
                  {canConnect && (
                    <DialPrimaryButton
                      label={t(AnalyticsTablesI18nKey.Connect)}
                      onClick={() => setConnectOpen(true)}
                      iconBefore={<IconPlugConnected size={18} />}
                    />
                  )}
                </>
              ) : (
                canModify && (
                  <>
                    {/* In editor mode the column form's completeness rules do not apply: the document
                        is submitted as written and the service decides. */}
                    <DialPrimaryButton
                      label={t(ButtonsI18nKey.Save)}
                      disabled={!isEditorEnabled && !draft.canMaterialize}
                      onClick={onTryToSave}
                    />
                    <JsonToggle isEditorEnabled={isEditorEnabled} onToggleEditor={onToggleEditor} />
                  </>
                )
              )}
            </div>
          )}
        </div>
        {/* Its own row rather than a share of the title row, so the single line spans the full header
            width instead of whatever the actions leave over — the same ellipsis, several times the text,
            and the rest still in the tooltip. */}
        {table.description && <DialEllipsisTooltip text={table.description} className="text-primary dial-small" />}
      </div>

      {/* One fallback for both conditions: with analytics disabled, or on a table that is not active,
          the Properties body is the whole view — no tab strip, and no Audit tab to issue an analytics
          activity request from. */}
      {featureFlags.analyticsEnabled && isActive ? (
        <>
          <div className="mb-6">
            <DialTabs tabs={tabs} activeTab={activeTab} onClick={(tab) => setActiveTab(tab as EntityViewTab)} />
          </div>
          {activeTab === EntityViewTab.Properties && properties}
          {activeTab === EntityViewTab.Audit && (
            <div className="flex min-h-0 flex-1 flex-col">
              <TableAudit table={table} />
            </div>
          )}
        </>
      ) : (
        draftSurface
      )}

      {confirmOpen && (
        <DialConfirmationPopup
          open={confirmOpen}
          variant={ConfirmationPopupVariant.Danger}
          header={t(AnalyticsTablesI18nKey.DeleteConfirmTitle)}
          description={
            <div className="flex flex-col gap-y-2">
              <span>{t(AnalyticsTablesI18nKey.DeleteConfirmDescription)}</span>
              <div className="flex flex-row items-center gap-x-1 text-primary dial-small">
                <span className="text-secondary shrink-0">{t(AnalyticsTablesI18nKey.Name)}:</span>
                <DialEllipsisTooltip text={name} />
              </div>
            </div>
          }
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
          header={t(AnalyticsTablesI18nKey.AddRows)}
          submitLabel={t(AnalyticsTablesI18nKey.InsertRows)}
          disableSubmitButton={!parseRowsJson(rowsJson)}
          onClose={() => setWriteOpen(false)}
          onSubmit={() => void onSubmitWriteRows()}
        >
          <div className="flex flex-col gap-3 p-6">
            <div className="flex flex-col items-start gap-1 border-l-2 border-tertiary pl-3">
              <p className="dial-tiny-text text-secondary">{t(AnalyticsTablesI18nKey.AddRowsPurpose)}</p>
              <DialGhostButton
                label={t(AnalyticsTablesI18nKey.WriteProgrammatically)}
                onClick={onWriteProgrammatically}
              />
            </div>
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
          sensitiveDisabled={isScanMetadataColumn(table, editColumn)}
          existingNames={columns.filter((c) => c.name !== editColumn.name).map((c) => c.name)}
          onClose={() => setEditColumn(null)}
          onSubmit={(patch) => void onSubmitEditColumn(patch)}
        />
      )}

      {accessOpen && <TableAccessPanel name={name} onClose={() => setAccessOpen(false)} />}

      {connectOpen && (
        <ConnectPanel
          table={table}
          apiBaseUrl={apiBaseUrl}
          flightUri={flightUri}
          onClose={() => setConnectOpen(false)}
        />
      )}
    </div>
  );
};

export default TableDetailView;
