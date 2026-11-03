'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';
import { IconDotsVertical, IconLayoutGrid, IconPencilMinus, IconPlus, IconTrashX } from '@tabler/icons-react';
import { GhostButton } from '@epam/ai-dial-ui-kit';

import { deleteDashboard, replaceDashboard } from '@/src/app/[lang]/dashboards/custom-actions';
import DashboardGrid from '@/src/components/Analytics/CustomDashboards/Grid/DashboardGrid';
import DashboardDetailsModal from '@/src/components/Analytics/CustomDashboards/Modals/DashboardDetailsModal';
import DeleteDashboardPopup from '@/src/components/Analytics/CustomDashboards/Modals/DeleteDashboardPopup';
import PublishDashboardPopup from '@/src/components/Analytics/CustomDashboards/Modals/PublishDashboardPopup';
import WidgetSettingsModal from '@/src/components/Analytics/CustomDashboards/Modals/WidgetSettingsModal';
import {
  DashboardDetails,
  EditedWidget,
  PendingPublish,
  WidgetResultOptions,
  WidgetSettings,
  WidgetSourceKind,
} from '@/src/components/Analytics/CustomDashboards/models';
import { isComparingView, resolveWidgetView } from '@/src/components/Analytics/CustomDashboards/utils/widget-views';
import { getDashboardWriteErrorNotification } from '@/src/components/Analytics/CustomDashboards/utils/write-error';
import { toStoredWidgetSettings } from '@/src/components/Analytics/CustomDashboards/utils/widget-settings';
import CompareSelect from '@/src/components/Analytics/Usage/Controls/CompareSelect';
import UsageEmptyState from '@/src/components/Analytics/Usage/Empty/UsageEmptyState';
import { ComparePeriod } from '@/src/components/Analytics/Usage/models';
import DashboardSwitcher from '@/src/components/Analytics/CustomDashboards/Switcher/DashboardSwitcher';
import { useCustomDashboard } from '@/src/components/Analytics/CustomDashboards/use-custom-dashboard';
import WidgetCard from '@/src/components/Analytics/CustomDashboards/Widget/WidgetCard';
import ActionsDropdown from '@/src/components/Common/ActionsDropdown/ActionsDropdown';
import { TimeFilterAppearance } from '@/src/components/Common/TimeFilter/models';
import TimeFilter from '@/src/components/Common/TimeFilter/TimeFilter';
import ChangedEntityButtons from '@/src/components/EntityHeaderControls/Buttons/ChangedEntityButtons';
import { DEFAULT_CURRENCY, DEFAULT_WIDGET_ROWS } from '@/src/constants/analytics/dashboards';
import { ButtonsI18nKey, CustomDashboardsI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';
import {
  ChangeDirection,
  DashboardCreatePermissions,
  DashboardListItem,
  DashboardVisibility,
  DashboardWidget,
  ResolvedDashboard,
  WidgetQueryKind,
  WidgetValueFormat,
  WidgetView,
} from '@/src/models/analytics/dashboard';
import { SavedQuery, SavedQueryScope } from '@/src/models/analytics/saved-query';
import { ApplicationRoute } from '@/src/types/routes';
import { getDashboardHref, toDashboardRequest } from '@/src/utils/analytics/dashboard-request';
import {
  CopiedPersonalQueries,
  copyPersonalQueries,
  getWidgetQueryKey,
  hasUnresolvedSavedQueries,
  getWidgetQuerySource,
  toInlineQuery,
  toSqlInlineQuery,
} from '@/src/utils/analytics/widget-source';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';

interface Props {
  resolved: ResolvedDashboard;
  dashboards: DashboardListItem[];
  createPermissions: DashboardCreatePermissions;
  isInitiallyEditing: boolean;
}

const NEW_WIDGET_SETTINGS: WidgetSettings = {
  source: WidgetSourceKind.SavedQuery,
  savedQueryId: '',
  sql: '',
  title: '',
  description: '',
  rowCount: String(DEFAULT_WIDGET_ROWS),
  view: WidgetView.Query,
  valueColumn: '',
  changeDirection: ChangeDirection.HigherIsBetter,
  valueFormat: WidgetValueFormat.Number,
  currency: DEFAULT_CURRENCY,
};

const CustomDashboardView: FC<Props> = ({ resolved, dashboards, createPermissions, isInitiallyEditing }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const dashboard = useCustomDashboard(resolved, isInitiallyEditing);
  const { stored, widgets, queries, timeFilter, compare, isEditing } = dashboard;
  const canWrite = stored.permissions.write;
  const isPublic = stored.visibility === DashboardVisibility.Public;

  const [isNarrow, setIsNarrow] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [edited, setEdited] = useState<EditedWidget | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [pendingPublish, setPendingPublish] = useState<PendingPublish | null>(null);
  const [deniedIds, setDeniedIds] = useState<ReadonlySet<string>>(() => new Set());

  const onDeniedChange = useCallback((id: string, isDenied: boolean) => {
    setDeniedIds((prev) => {
      if (prev.has(id) === isDenied) return prev;
      const next = new Set(prev);
      if (isDenied) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const writeDetails = useCallback(
    async (
      { name, description, compare: storedCompare, visibility }: DashboardDetails,
      copied: CopiedPersonalQueries | null,
    ): Promise<boolean> => {
      const request = {
        ...toDashboardRequest(stored),
        name,
        description: description || undefined,
        compare: storedCompare,
        visibility,
        widgets: copied?.widgets ?? stored.widgets,
      };
      const res = await replaceDashboard(stored.id, request, stored.generation);
      if (!res.success || !res.response) {
        showNotification(getDashboardWriteErrorNotification(res, t));
        return false;
      }
      if (copied) dashboard.onQueriesChange(copied.queries);
      dashboard.setStored(res.response);
      // The new default applies at once, as if the dashboard had just been opened.
      dashboard.onCompareChange(storedCompare);
      router.refresh();
      return true;
    },
    [stored, dashboard, router, showNotification, t],
  );

  // Publishing copies each personal query in, since no other viewer could read it by reference, and waits for a
  // confirmation naming them.
  const onEditDetails = useCallback(
    async (details: DashboardDetails): Promise<boolean> => {
      const isPublishing = details.visibility === DashboardVisibility.Public && !isPublic;
      if (!isPublishing) return writeDetails(details, null);
      if (hasUnresolvedSavedQueries(stored.widgets, queries)) {
        showNotification(
          getErrorNotification(
            t(CustomDashboardsI18nKey.PublishUnresolved),
            t(CustomDashboardsI18nKey.PublishUnresolvedHint),
          ),
        );
        return false;
      }
      const copied = copyPersonalQueries(stored.widgets, queries);
      if (!copied.copiedNames.length) return writeDetails(details, copied);
      setPendingPublish({ details, copied });
      return false;
    },
    [isPublic, stored.widgets, queries, writeDetails, showNotification, t],
  );

  const onConfirmPublish = useCallback(async () => {
    if (!pendingPublish) return;
    const isDone = await writeDetails(pendingPublish.details, pendingPublish.copied);
    setPendingPublish(null);
    if (isDone) setIsDetailsOpen(false);
  }, [pendingPublish, writeDetails]);

  // A widget added to a public dashboard copies a personal query, for the reason publishing does.
  const onAddWidget = useCallback(
    (settings: WidgetSettings, rowLimit: number, picked?: SavedQuery) => {
      const base = {
        id: crypto.randomUUID(),
        title: settings.title || undefined,
        description: settings.description || undefined,
        row_limit: rowLimit,
      };
      if (settings.source === WidgetSourceKind.Sql) {
        dashboard.onAddWidget({ ...base, inline_query: toSqlInlineQuery(settings.title, settings.sql) });
      } else if (isPublic && picked?.scope === SavedQueryScope.Personal) {
        dashboard.onAddWidget({ ...base, title: base.title ?? picked.name, inline_query: toInlineQuery(picked) });
      } else {
        dashboard.onAddWidget({ ...base, saved_query_id: settings.savedQueryId });
      }
    },
    [dashboard, isPublic],
  );

  const onDelete = useCallback(async () => {
    setIsDeleteOpen(false);
    const res = await deleteDashboard(stored.id);
    if (!res.success) {
      showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      return;
    }
    showNotification(getSuccessNotification(t(CustomDashboardsI18nKey.Deleted), stored.name));
    router.push(ApplicationRoute.Dashboard);
  }, [stored, router, showNotification, t]);

  const onOpenWidgetSettings = useCallback(
    (id: string, options: WidgetResultOptions) => {
      const widget = widgets.find((item) => item.id === id);
      setEdited(widget ? { widget, ...options } : null);
    },
    [widgets],
  );

  const { onRemoveWidget, onMoveWidget, onResizeWidget, onRetryQuery } = dashboard;
  const renderWidget = useCallback(
    (widget: DashboardWidget, index: number, ordered: DashboardWidget[]) => (
      <WidgetCard
        widget={widget}
        widgetQuery={queries[getWidgetQueryKey(widget)]}
        range={timeFilter.timeRange}
        period={timeFilter.isCustom ? undefined : timeFilter.timePeriod}
        compare={compare}
        isEditing={isEditing}
        isFirst={index === 0}
        isLast={index === ordered.length - 1}
        onEditSettings={onOpenWidgetSettings}
        onRemove={onRemoveWidget}
        onMove={onMoveWidget}
        onResize={onResizeWidget}
        onDeniedChange={onDeniedChange}
        onRetryQuery={onRetryQuery}
      />
    ),
    [
      onDeniedChange,
      onRetryQuery,
      queries,
      timeFilter.timeRange,
      timeFilter.isCustom,
      timeFilter.timePeriod,
      compare,
      isEditing,
      onOpenWidgetSettings,
      onRemoveWidget,
      onMoveWidget,
      onResizeWidget,
    ],
  );

  const onEditLayout = dashboard.onEdit;

  // Stable across the re-renders widget runs cause: a new item list closes a menu that is already open.
  const headerActions = useMemo<ActionMenuOperationDeclaration<object>[]>(
    () =>
      canWrite
        ? [
            {
              id: 'edit-details',
              label: CustomDashboardsI18nKey.EditDetails,
              icon: <IconPencilMinus {...BASE_BUTTON_ICON_PROPS} aria-hidden />,
              onClick: () => setIsDetailsOpen(true),
            },
            {
              id: 'edit-layout',
              label: CustomDashboardsI18nKey.EditLayout,
              icon: <IconLayoutGrid {...BASE_BUTTON_ICON_PROPS} aria-hidden />,
              // The layout is edited on the full grid only; a narrow screen stacks widgets in one column.
              disabled: isNarrow,
              onClick: onEditLayout,
            },
            {
              id: 'delete-dashboard',
              label: CustomDashboardsI18nKey.DeleteDashboard,
              icon: <IconTrashX {...BASE_BUTTON_ICON_PROPS} aria-hidden />,
              onClick: () => setIsDeleteOpen(true),
            },
          ]
        : [],
    [canWrite, isNarrow, onEditLayout],
  );

  // The edit parameter only opens a just-created dashboard in edit mode; it is dropped once read, so a later
  // reload opens whatever the dashboard's state then is rather than edit mode again.
  useEffect(() => {
    if (isInitiallyEditing) router.replace(getDashboardHref(resolved.dashboard.id));
  }, [isInitiallyEditing, resolved.dashboard.id, router]);

  const editedWidget = edited?.widget;
  const editedQuery = editedWidget ? queries[getWidgetQueryKey(editedWidget)] : undefined;
  const isEditedComposite = editedQuery?.kind === WidgetQueryKind.CompositeSql;
  const editedSql = editedWidget?.inline_query?.sql;
  // In view mode only: in edit mode the author still needs the widgets, to remove or fix them.
  const isNothingAvailable = !isEditing && widgets.length > 0 && widgets.every((widget) => deniedIds.has(widget.id));

  // The query's own view compares exactly when it is a table, so the same rule decides whether it has a direction.
  const isEditedQueryTable = isComparingView(WidgetView.Query, getWidgetQuerySource(editedQuery));

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-5 overflow-auto px-3 pb-3">
      <h1 className="dial-h1-text">{t(MenuI18nKey.Dashboard)}</h1>

      <div className="flex flex-row flex-wrap items-center gap-x-3 gap-y-2">
        <DashboardSwitcher dashboards={dashboards} createPermissions={createPermissions} currentId={stored.id} />
        <TimeFilter
          timePeriod={timeFilter.timePeriod}
          onTimePeriodChange={dashboard.onTimePeriodChange}
          timeRange={timeFilter.timeRange}
          onTimeRangeChange={dashboard.onTimeRangeChange}
          appearance={TimeFilterAppearance.Modern}
        />
        <CompareSelect value={compare} onChange={dashboard.onCompareChange} />
        <div className="grow" />
        {isEditing ? (
          <>
            <GhostButton
              iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
              label={t(CustomDashboardsI18nKey.AddWidget)}
              onClick={() => setIsAddOpen(true)}
            />
            {/* Nothing to keep or lose until something changed, so the way out is a plain Cancel. */}
            {dashboard.hasChanges ? (
              <ChangedEntityButtons
                disableSave={dashboard.isSaving}
                onDiscard={dashboard.onDiscard}
                onSave={dashboard.onSave}
              />
            ) : (
              <GhostButton label={t(ButtonsI18nKey.Cancel)} onClick={dashboard.onDiscard} />
            )}
          </>
        ) : (
          headerActions.length > 0 && (
            <ActionsDropdown
              items={headerActions}
              icon={<IconDotsVertical {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
              actionTriggerClassName="flex size-8 items-center justify-center rounded text-secondary hover:bg-accent-primary-alpha focus-visible:bg-accent-primary-alpha"
            />
          )
        )}
      </div>

      {stored.description && <p className="-mt-2 dial-small-text text-secondary">{stored.description}</p>}

      {!widgets.length && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10">
          <UsageEmptyState
            title={t(CustomDashboardsI18nKey.EmptyTitle)}
            lines={[t(CustomDashboardsI18nKey.EmptyDescription)]}
          />
          {isEditing && <GhostButton label={t(CustomDashboardsI18nKey.AddWidget)} onClick={() => setIsAddOpen(true)} />}
          {!isEditing && canWrite && (
            <GhostButton label={t(CustomDashboardsI18nKey.EditLayout)} disabled={isNarrow} onClick={dashboard.onEdit} />
          )}
        </div>
      )}

      {/* Kept mounted under the message, since each widget is what reports whether it is available. */}
      {isNothingAvailable && (
        <UsageEmptyState title={t(CustomDashboardsI18nKey.DashboardUnavailable)} className="flex-1 py-10" />
      )}
      <div className={isNothingAvailable ? 'hidden' : 'contents'}>
        <DashboardGrid
          widgets={widgets}
          isEditable={isEditing && !isNarrow}
          renderWidget={renderWidget}
          onPlacementsChange={dashboard.onPlacementsChange}
          onNarrowChange={setIsNarrow}
        />
      </div>

      {isAddOpen && (
        <WidgetSettingsModal
          header={t(CustomDashboardsI18nKey.AddWidget)}
          submitLabel={t(ButtonsI18nKey.Add)}
          initial={NEW_WIDGET_SETTINGS}
          isQueryPickable
          isDashboardPublic={isPublic}
          onSubmit={onAddWidget}
          onClose={() => setIsAddOpen(false)}
        />
      )}

      {edited && editedWidget && (
        <WidgetSettingsModal
          header={t(CustomDashboardsI18nKey.WidgetSettings)}
          submitLabel={t(ButtonsI18nKey.Save)}
          initial={{
            source: editedSql == null ? WidgetSourceKind.SavedQuery : WidgetSourceKind.Sql,
            savedQueryId: editedWidget.saved_query_id ?? '',
            sql: editedSql ?? '',
            title: editedWidget.title ?? '',
            description: editedWidget.description ?? '',
            rowCount: String(editedWidget.row_limit),
            view: resolveWidgetView(editedWidget.view, edited.fittingViews),
            valueColumn: editedWidget.value_column ?? edited.valueColumns[0]?.value ?? '',
            changeDirection: editedWidget.change_direction ?? ChangeDirection.HigherIsBetter,
            valueFormat: editedWidget.settings?.value_format ?? WidgetValueFormat.Number,
            currency: editedWidget.settings?.currency ?? DEFAULT_CURRENCY,
          }}
          isQueryPickable={false}
          previewSource={getWidgetQuerySource(editedQuery) ?? undefined}
          isRowCountLocked={isEditedComposite}
          fittingViews={edited.fittingViews}
          valueColumns={edited.valueColumns}
          isQueryViewTable={isEditedQueryTable}
          onSubmit={(settings, rowLimit) =>
            dashboard.onUpdateWidget(editedWidget.id, {
              title: settings.title || undefined,
              description: settings.description || undefined,
              row_limit: isEditedComposite ? editedWidget.row_limit : rowLimit,
              // The query's own view is the default, so it is stored as no view at all.
              view: settings.view === WidgetView.Query ? undefined : settings.view,
              value_column: settings.view === WidgetView.SingleValue ? settings.valueColumn || undefined : undefined,
              // Higher is better is the default, so only the other direction is stored.
              change_direction:
                settings.changeDirection === ChangeDirection.LowerIsBetter ? ChangeDirection.LowerIsBetter : undefined,
              // A plain number and US dollars are the defaults, so only a departure from them is stored.
              settings: toStoredWidgetSettings(editedWidget.settings, settings),
              // An inline SQL statement — typed, or copied from a SQL query — is the widget's own and edited in place;
              // a copied structured body has no editor here and stays as it was copied.
              ...(editedWidget.inline_query && editedSql != null
                ? { inline_query: { ...editedWidget.inline_query, name: settings.title, sql: settings.sql } }
                : {}),
            })
          }
          onClose={() => setEdited(null)}
        />
      )}

      {isDetailsOpen && (
        <DashboardDetailsModal
          header={t(CustomDashboardsI18nKey.EditDetails)}
          submitLabel={t(ButtonsI18nKey.Save)}
          initial={{
            name: stored.name,
            description: stored.description ?? '',
            compare: stored.compare ?? ComparePeriod.Off,
            visibility: stored.visibility,
          }}
          canPublish={stored.permissions.publish}
          onSubmit={onEditDetails}
          onClose={() => setIsDetailsOpen(false)}
        />
      )}

      {pendingPublish && (
        <PublishDashboardPopup
          queryNames={pendingPublish.copied.copiedNames}
          onConfirm={onConfirmPublish}
          onCancel={() => setPendingPublish(null)}
        />
      )}

      {isDeleteOpen && (
        <DeleteDashboardPopup name={stored.name} onConfirm={onDelete} onCancel={() => setIsDeleteOpen(false)} />
      )}
    </div>
  );
};

export default CustomDashboardView;
