'use client';

import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { GridApi, IRowNode } from 'ag-grid-community';
import {
  Button,
  ButtonAppearance,
  ButtonVariant,
  ConfirmationPopupVariant,
  ConfirmationPopup,
  EllipsisTooltip,
  Popup,
  GhostButton,
  PopupSize,
  Tabs,
} from '@epam/ai-dial-ui-kit';

import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import { IconPlugConnected } from '@tabler/icons-react';

import {
  addRows,
  defineTableSchema,
  deleteTable,
  getTable,
  updateTable,
  updateTableSchema,
} from '@/src/app/[lang]/tables/actions';
import IdentityTag from '@/src/components/Analytics/Common/IdentityTag';
import ClampedDescription from '@/src/components/Analytics/Tables/ClampedDescription';
import ColumnRowsEditor from '@/src/components/Analytics/Tables/ColumnRowsEditor';
import ConnectPanel from '@/src/components/Analytics/Tables/ConnectPanel/ConnectPanel';
import { isEnrichmentRead } from '@/src/components/Analytics/Tables/ConnectPanel/connect-snippets';
import {
  buildDraftDocument,
  formatDraftDocument,
  splitDraftDocument,
} from '@/src/components/Analytics/Tables/draft-document';
import EditColumnPopup from '@/src/components/Analytics/Tables/EditColumnPopup';
import AccessTab from '@/src/components/Analytics/Tables/access/AccessTab';
import { useTableAccess } from '@/src/components/Analytics/Tables/access/use-table-access';
import RowsRestrictedBadge from '@/src/components/Analytics/Tables/RowsRestrictedBadge';
import TableAudit from '@/src/components/Analytics/Tables/TableAudit';
import TableProperties from '@/src/components/Analytics/Tables/TableProperties';
import TableStatusBadge from '@/src/components/Analytics/Tables/TableStatusBadge';
import { TABLE_TYPE_LABEL } from '@/src/components/Analytics/Tables/constants';
import { useDraftSchemaForm } from '@/src/components/Analytics/Tables/use-draft-schema-form';
import {
  buildRowsTemplate,
  createColumnRow,
  getColumnRowErrors,
  hasColumnRowErrors,
  isDropRestrictedColumn,
  isRenameRestricted,
  isScanMetadataColumn,
  parseRowsJson,
  toTableColumns,
} from '@/src/components/Analytics/Tables/utils';
import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import JsonEditorBase from '@/src/components/Common/JsonEditorBase/JsonEditorBase';
import ChangedEntityButtons from '@/src/components/EntityHeaderControls/Buttons/ChangedEntityButtons';
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
import { accessTab, auditTab, EntityViewTab, propertiesTab } from '@/src/utils/tabs/utils';
import { getAnalyticsIdentifierError } from '@/src/utils/validation/analytics-table-error';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
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
  // While an ACTIVE table's definition is shown as JSON, the header offers only copying it and leaving the view.
  const isJsonViewOnly = isActive && isEditorEnabled;
  const { canDelete, canWrite, canModify, canManageRoles, canChangeSensitive, isRowsRestricted } =
    useAnalyticsTablePermissions(table);
  // Read with the view: the tab's presence depends on it.
  const access = useTableAccess(name, canManageRoles && isActive && featureFlags.analyticsEnabled);
  const columns = useMemo(() => table.columns ?? [], [table.columns]);

  const draft = useDraftSchemaForm(table, sourceTable, t);

  // The DTO the table's stored definition yields, turned into the same document shape the editor
  // seeds from — serves both as the document's unchanged baseline and as what Discard restores.
  const storedDocument = useMemo(() => buildDraftDocument(table, draft.baselineDto), [table, draft.baselineDto]);
  // Only meaningful once the document has been seeded; before that there is nothing to compare.
  const isDocumentChanged = Boolean(draftDocument) && !isEqualSkippingUndefined(draftDocument, storedDocument);
  // EntityJsonEditor forwards only a successful parse, so text the caller broke never reaches
  // draftDocument — without the markers there is no Discard to back out of it and no Save to be told
  // what is wrong.
  const hasJsonErrors = isEditorEnabled && Boolean(jsonErrors?.length);
  const isChangeBarShown = !isActive && canModify && (draft.isChanged || isDocumentChanged || hasJsonErrors);

  // An enrichment's grain key is a column on its source table (draft: populates grain-key options;
  // active: backfills the pinned grain-key row's type/tag/display metadata, which the enrichment table's
  // own API response never exposes for that hidden column — see grainKeyRow below).
  useEffect(() => {
    if (table.type !== AnalyticsTableType.Enrichment || !table.source_table) {
      setSourceTable(null);
      return;
    }
    let cancelled = false;
    void getTable(table.source_table).then((read) => {
      if (!cancelled) setSourceTable(read?.response ?? null);
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
    const read = await getTable(name);
    if (read?.response) setTable(read.response);
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
        // Before the reload, not after: the refreshed table reads ACTIVE, where the same toggle means
        // the read-only definition view, and an author who just materialized belongs on the live column
        // surface (design.md D1). Resetting first leaves no commit in which ACTIVE meets an open editor.
        setIsEditorEnabled(false);
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
  // a later entry would silently discard it. An ACTIVE table's view reads `storedDocument` and never
  // `draftDocument`, so seeding there would only be dead state for `isDocumentChanged` to compare.
  const onToggleEditor = () => {
    if (!isActive && !draftDocument) setDraftDocument(buildDraftDocument(table, draft.buildDto()));
    setIsEditorEnabled((prev) => !prev);
  };

  // The dispatch has to precede the two resets: EntityJsonEditor keeps its editor id across the remount,
  // so a stale marker would otherwise hold the changed header up on its own. The active surface does not change: discarding while the editor is open leaves the
  // author in the editor, looking at the restored document.
  const onDiscard = () => {
    dispatch({ type: ValidationActionType.Reset });
    draft.reset();
    if (draftDocument) setDraftDocument(storedDocument);
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
      return isDropRestrictedColumn(table, column);
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
  const tabs = useMemo(
    () => [propertiesTab(t), ...(access.isTabOffered ? [accessTab(t)] : []), auditTab(t)],
    [t, access.isTabOffered],
  );
  // The selected tab can stop being offered (the access read was refused on a reload).
  const selectedTab = tabs.some((tab) => tab.id === activeTab) ? activeTab : EntityViewTab.Properties;

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

  // The draft's two authoring surfaces are mutually exclusive: the toggle swaps the column-by-column
  // surface for the editable document and back.
  const draftSurface = isEditorEnabled ? draftEditor : properties;

  // The same object the memo at the top produced, handed over by reference: EntityJsonEditor keeps the
  // last `entity` it saw and remounts Monaco for any object that is not identical to it, so a
  // re-derivation, a clone or a spread here would remount on every parent render (design.md D3).
  // Read-only here is a rule, not a structure: `setDraftDocument` is in scope at this call site, so
  // nothing but discipline stops a writer prop being added. `readonly` alone is not enough — passing
  // `setSelectedEntity`, `setIsChanged` or `onChangeText` would make this surface editable (design.md D5).
  const definitionJson = (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <EntityJsonEditor entity={storedDocument} readonly />
    </div>
  );

  // A full JSON.stringify of the definition, re-derived only when the memoized document itself
  // changes — not on every one of this view's many unrelated re-renders (design.md D6).
  const copyValue = useMemo(() => formatDraftDocument(storedDocument), [storedDocument]);

  const tabbedBody = (
    <>
      <div className="mb-6">
        <Tabs
          ariaLabel={name}
          tabs={tabs}
          activeTabId={selectedTab}
          onTabChange={(tab) => setActiveTab(tab as EntityViewTab)}
        />
      </div>
      {selectedTab === EntityViewTab.Properties && properties}
      {selectedTab === EntityViewTab.Access && (
        <div className="flex min-h-0 flex-1 flex-col">
          <AccessTab tableName={name} columns={columns} isSystem={isSystem} access={access} />
        </div>
      )}
      {selectedTab === EntityViewTab.Audit && (
        <div className="flex min-h-0 flex-1 flex-col">
          <TableAudit table={table} />
        </div>
      )}
    </>
  );

  // With analytics disabled the Properties content is the whole body — no tab strip, and no Audit tab to
  // issue an analytics activity request from.
  const activeBody = featureFlags.analyticsEnabled ? tabbedBody : properties;
  // The read-only document takes over the whole body, tab strip included, so nothing of the page is left
  // reachable behind it. `activeTab` is untouched, which is what brings the reader back to the tab they
  // were on when the toggle goes off.
  const activeSurface = isEditorEnabled ? definitionJson : activeBody;

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 relative">
      <div className="flex flex-col mb-8 gap-2">
        <div className="flex flex-row justify-between items-center gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="dial-h1-text truncate">{name}</h1>
            <TableStatusBadge status={table.status} />
            {isRowsRestricted && <RowsRestrictedBadge hasTooltip />}
            <IdentityTag label={t(TABLE_TYPE_LABEL[table.type])} />
            {isSystem && <IdentityTag label={t(AnalyticsTablesI18nKey.SystemReadOnly)} />}
          </div>
          {/* shrink-0 keeps the actions at their natural width, so no description length can squeeze a
              button label onto a second line; the title next to them truncates instead. */}
          {/* `isActive` alone, not `isActive && canConnect`: on an active table the JSON-editor toggle
              is always in the container, so an enrichment with no source table viewed by a caller with
              no permissions still gets a header. Every other child keeps its own gate. */}
          {(isActive || canDelete || canWrite || canModify) && (
            <div className="flex shrink-0 items-center gap-4">
              {isChangeBarShown && (
                <ChangedEntityButtons
                  disableSave={!isEditorEnabled && !draft.canMaterialize}
                  onDiscard={onDiscard}
                  onSave={onTryToSave}
                />
              )}
              {isJsonViewOnly && (
                <>
                  <CopyButton
                    buttonLabel={t(ButtonsI18nKey.Copy)}
                    valueLabel={t(AnalyticsTablesI18nKey.JsonDefinition)}
                    value={copyValue}
                  />
                  <JsonToggle isEditorEnabled={isEditorEnabled} onToggleEditor={onToggleEditor} />
                </>
              )}
              {!isChangeBarShown && !isJsonViewOnly && (
                <>
                  {canDelete && (
                    <Button
                      variant={ButtonVariant.Danger}
                      appearance={ButtonAppearance.Outlined}
                      label={t(AnalyticsTablesI18nKey.DeleteTable)}
                      onClick={() => setConfirmOpen(true)}
                    />
                  )}
                  {isActive ? (
                    <>
                      {canModify && (
                        <Button
                          variant={ButtonVariant.Neutral}
                          appearance={ButtonAppearance.Outlined}
                          label={t(AnalyticsTablesI18nKey.AddColumns)}
                          onClick={() => setAddOpen(true)}
                        />
                      )}
                      {canWrite && !isEnrichment && (
                        <Button
                          variant={ButtonVariant.Neutral}
                          appearance={ButtonAppearance.Outlined}
                          label={t(AnalyticsTablesI18nKey.AddRows)}
                          onClick={onAddRows}
                        />
                      )}
                      {/* Not permission-gated: a reader who cannot yet write is the one who needs to learn
                          which role to ask for. An enrichment gets the read-only panel — see canConnect. */}
                      {canConnect && (
                        <Button
                          variant={ButtonVariant.Primary}
                          label={t(AnalyticsTablesI18nKey.Connect)}
                          onClick={() => setConnectOpen(true)}
                          iconBefore={<IconPlugConnected size={18} aria-hidden />}
                        />
                      )}
                      {/* Not permission-gated: on an active table it opens a read-only view of the stored
                          definition and writes nothing, and a system table is the one whose definition is
                          most often read as a document. */}
                      <JsonToggle isEditorEnabled={isEditorEnabled} onToggleEditor={onToggleEditor} />
                    </>
                  ) : (
                    canModify && <JsonToggle isEditorEnabled={isEditorEnabled} onToggleEditor={onToggleEditor} />
                  )}
                </>
              )}
            </div>
          )}
        </div>
        {/* Its own row rather than a share of the title row, so it spans the full header width instead of
            whatever the actions leave over. Clamped rather than ellipsised: a description is written to be
            read, and a tooltip asks for a hover no keyboard can give. */}
        {table.description && <ClampedDescription text={table.description} className="text-primary dial-small" />}
      </div>

      {isActive ? activeSurface : draftSurface}

      {confirmOpen && (
        <ConfirmationPopup
          open={confirmOpen}
          variant={ConfirmationPopupVariant.Danger}
          header={t(AnalyticsTablesI18nKey.DeleteConfirmTitle)}
          description={
            <div className="flex flex-col gap-y-2">
              <span>{t(AnalyticsTablesI18nKey.DeleteConfirmDescription)}</span>
              <div className="flex flex-row items-center gap-x-1 text-primary dial-small">
                <span className="text-secondary shrink-0">{t(AnalyticsTablesI18nKey.Name)}:</span>
                <EllipsisTooltip text={name} />
              </div>
            </div>
          }
          confirmLabel={t(AnalyticsTablesI18nKey.DeleteTable)}
          onConfirm={() => void onConfirmDelete()}
          onClose={() => setConfirmOpen(false)}
        />
      )}

      {addOpen && (
        <Popup
          open={addOpen}
          portalId="qb-add-columns"
          size={PopupSize.Lg}
          header={t(AnalyticsTablesI18nKey.AddColumns)}
          onClose={() => setAddOpen(false)}
          mainButtons={getFormPopupButtons({
            cancelLabel: t(ButtonsI18nKey.Cancel),
            submitLabel: t(AnalyticsTablesI18nKey.AddColumns),
            isSubmitDisabled: toTableColumns(addColumns).length === 0 || hasColumnRowErrors(addColumnErrors),
            onCancel: () => setAddOpen(false),
            onSubmit: () => void onSubmitAddColumns(),
          })}
        >
          <div className="max-h-[70vh] overflow-auto p-6">
            <ColumnRowsEditor rows={addColumns} errors={addColumnErrors} onChange={setAddColumns} />
          </div>
        </Popup>
      )}

      {writeOpen && (
        <Popup
          open={writeOpen}
          portalId="qb-write-rows"
          size={PopupSize.Lg}
          header={t(AnalyticsTablesI18nKey.AddRows)}
          onClose={() => setWriteOpen(false)}
          mainButtons={getFormPopupButtons({
            cancelLabel: t(ButtonsI18nKey.Cancel),
            submitLabel: t(AnalyticsTablesI18nKey.InsertRows),
            isSubmitDisabled: !parseRowsJson(rowsJson),
            onCancel: () => setWriteOpen(false),
            onSubmit: () => void onSubmitWriteRows(),
          })}
        >
          <div className="flex flex-col gap-3 p-6">
            <div className="flex flex-col items-start gap-1 border-l-2 border-tertiary pl-3">
              <p className="dial-tiny-text text-secondary">{t(AnalyticsTablesI18nKey.AddRowsPurpose)}</p>
              <GhostButton label={t(AnalyticsTablesI18nKey.WriteProgrammatically)} onClick={onWriteProgrammatically} />
            </div>
            <div className="h-[320px] overflow-hidden rounded border border-primary">
              <JsonEditorBase value={rowsJson} onChange={(v) => setRowsJson(v ?? '')} />
            </div>
          </div>
        </Popup>
      )}

      {editColumn && (
        <EditColumnPopup
          column={editColumn}
          renameDisabled={isRenameRestricted(table, editColumn)}
          sensitiveDisabled={isScanMetadataColumn(table, editColumn)}
          isSensitiveLocked={!canChangeSensitive}
          existingNames={columns.filter((c) => c.name !== editColumn.name).map((c) => c.name)}
          onClose={() => setEditColumn(null)}
          onSubmit={(patch) => void onSubmitEditColumn(patch)}
        />
      )}

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
