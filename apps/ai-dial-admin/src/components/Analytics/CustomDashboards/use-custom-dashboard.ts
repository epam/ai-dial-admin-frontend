import { useCallback, useMemo, useRef, useState } from 'react';

import {
  replaceDashboard,
  resolveInlineWidgetQuery,
  resolveWidgetQuery,
} from '@/src/app/[lang]/dashboards/custom-actions';
import { NewWidget } from '@/src/components/Analytics/CustomDashboards/models';
import { getDashboardWriteErrorNotification } from '@/src/components/Analytics/CustomDashboards/utils/write-error';
import { ComparePeriod } from '@/src/components/Analytics/Usage/models';
import { CustomDashboardsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useTimeFilter } from '@/src/hooks/use-time-filter';
import { useI18n } from '@/src/locales/client';
import {
  Dashboard,
  DashboardRequest,
  DashboardWidget,
  GridItemPlacement,
  ResolvedDashboard,
  WidgetMoveDirection,
  WidgetQuery,
  WidgetQueryKind,
  WidgetSize,
} from '@/src/models/analytics/dashboard';
import { TimeRange } from '@/src/models/time-range';
import {
  appendWidget,
  applyPlacements,
  moveWidget,
  removeWidget,
  resizeWidget,
  updateWidget,
} from '@/src/utils/analytics/dashboard-layout';
import {
  isSameDashboardRequest,
  toDashboardRequest,
  toDashboardTime,
  toTimeFilterValue,
} from '@/src/utils/analytics/dashboard-request';
import { getWidgetQueryKey } from '@/src/utils/analytics/widget-source';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';

/**
 * A custom dashboard's state: the stored dashboard, and — in edit mode only — a draft of the whole write
 * payload. Every layout change edits the draft; Save writes it in one replace guarded by the generation.
 */
export const useCustomDashboard = (resolved: ResolvedDashboard, isInitiallyEditing: boolean) => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const [stored, setStored] = useState<Dashboard>(resolved.dashboard);
  const [draft, setDraft] = useState<DashboardRequest | null>(() =>
    isInitiallyEditing ? toDashboardRequest(resolved.dashboard) : null,
  );
  const [queries, setQueries] = useState<Record<string, WidgetQuery>>(resolved.queries);
  const [isSaving, setIsSaving] = useState(false);

  const timeFilter = useTimeFilter({ defaultTimeFilter: toTimeFilterValue(resolved.dashboard.time) });
  const [compare, setCompare] = useState<ComparePeriod>(resolved.dashboard.compare ?? ComparePeriod.Off);

  const isEditing = draft !== null;
  const widgets = draft?.widgets ?? stored.widgets;
  const storedRequest = useMemo(() => toDashboardRequest(stored), [stored]);
  const hasChanges = draft !== null && !isSameDashboardRequest(draft, storedRequest);

  const editWidgets = useCallback((change: (widgets: DashboardWidget[]) => DashboardWidget[]) => {
    setDraft((prev) => (prev ? { ...prev, widgets: change(prev.widgets) } : prev));
  }, []);

  // The queries as edit mode found them: Discard puts them back, so an inline query edited in the draft stops running.
  const storedQueriesRef = useRef<Record<string, WidgetQuery>>(resolved.queries);
  // The latest resolution asked for each query key; an earlier answer that lands after it is dropped.
  const resolutionIdsRef = useRef<Record<string, number>>({});

  const onEdit = useCallback(() => {
    storedQueriesRef.current = queries;
    setDraft(toDashboardRequest(stored));
  }, [stored, queries]);

  const resetTimeFilter = useCallback(
    (dashboard: Dashboard) => {
      const value = toTimeFilterValue(dashboard.time);
      if (typeof value === 'string') timeFilter.onTimePeriodChange(value);
      else timeFilter.onTimeRangeChange(value, true);
    },
    [timeFilter],
  );

  const onDiscard = useCallback(() => {
    // A resolution still in flight belongs to the discarded draft.
    const ids = resolutionIdsRef.current;
    Object.keys(ids).forEach((key) => (ids[key] += 1));
    setQueries(storedQueriesRef.current);
    setDraft(null);
    resetTimeFilter(stored);
    setCompare(stored.compare ?? ComparePeriod.Off);
  }, [resetTimeFilter, stored]);

  const onSave = useCallback(async () => {
    if (!draft) return;
    setIsSaving(true);
    try {
      const res = await replaceDashboard(stored.id, draft, stored.generation);
      if (!res.success || !res.response) {
        showNotification(getDashboardWriteErrorNotification(res, t));
        return;
      }
      setStored(res.response);
      setDraft(null);
      showNotification(getSuccessNotification(t(CustomDashboardsI18nKey.Saved), res.response.name));
    } catch {
      showNotification(getErrorNotification(t(ErrorI18nKey.Error), t(ErrorI18nKey.TryAgainLater)));
    } finally {
      setIsSaving(false);
    }
  }, [draft, stored, showNotification, t]);

  // A range change re-runs the widgets either way; only in edit mode does it become part of what Save writes.
  const onTimePeriodChange = useCallback(
    (period: string) => {
      timeFilter.onTimePeriodChange(period);
      setDraft((prev) => (prev ? { ...prev, time: toDashboardTime(period, timeFilter.timeRange, false) } : prev));
    },
    [timeFilter],
  );

  const onTimeRangeChange = useCallback(
    (range: TimeRange, isCustom?: boolean) => {
      timeFilter.onTimeRangeChange(range, isCustom);
      if (isCustom) setDraft((prev) => (prev ? { ...prev, time: toDashboardTime('', range, true) } : prev));
    },
    [timeFilter],
  );

  // Follows the period selector: only in edit mode does it become part of what Save writes.
  const onCompareChange = useCallback((next: ComparePeriod) => {
    setCompare(next);
    setDraft((prev) => (prev ? { ...prev, compare: next } : prev));
  }, []);

  // A saved query resolves once for every widget on it; an inline query is resolved again whenever it changes.
  const resolveQuery = useCallback(
    async (widget: Pick<DashboardWidget, 'id' | 'saved_query_id' | 'inline_query'>, isForced = false) => {
      const key = getWidgetQueryKey(widget);
      if (queries[key] && !isForced) return;
      const ids = resolutionIdsRef.current;
      const resolutionId = (ids[key] ?? 0) + 1;
      ids[key] = resolutionId;
      let widgetQuery: WidgetQuery | undefined;
      try {
        widgetQuery = widget.saved_query_id
          ? await resolveWidgetQuery(widget.saved_query_id)
          : widget.inline_query && (await resolveInlineWidgetQuery(widget.inline_query));
      } catch {
        // The widget leaves its loading state and offers Retry, which resolves the query again.
        widgetQuery = { kind: WidgetQueryKind.Failed };
      }
      if (widgetQuery && ids[key] === resolutionId) setQueries((prev) => ({ ...prev, [key]: widgetQuery }));
    },
    [queries],
  );

  /** Resolves a widget's query again, after a resolution that failed. */
  const onRetryQuery = useCallback(
    (widget: Pick<DashboardWidget, 'id' | 'saved_query_id' | 'inline_query'>) => void resolveQuery(widget, true),
    [resolveQuery],
  );

  const onAddWidget = useCallback(
    (widget: NewWidget) => {
      editWidgets((current) => appendWidget(current, widget));
      void resolveQuery(widget);
    },
    [editWidgets, resolveQuery],
  );

  /** Puts resolved queries in place without resolving them again, as publishing does for its copies. */
  const onQueriesChange = useCallback((next: Record<string, WidgetQuery>) => setQueries(next), []);

  const onUpdateWidget = useCallback(
    (
      id: string,
      patch: Pick<
        DashboardWidget,
        | 'title'
        | 'description'
        | 'row_limit'
        | 'view'
        | 'value_column'
        | 'change_direction'
        | 'settings'
        | 'inline_query'
      >,
    ) => {
      editWidgets((current) => updateWidget(current, id, patch));
      if (patch.inline_query) void resolveQuery({ id, inline_query: patch.inline_query }, true);
    },
    [editWidgets, resolveQuery],
  );

  const onRemoveWidget = useCallback(
    (id: string) => editWidgets((current) => removeWidget(current, id)),
    [editWidgets],
  );

  const onMoveWidget = useCallback(
    (id: string, direction: WidgetMoveDirection) => editWidgets((current) => moveWidget(current, id, direction)),
    [editWidgets],
  );

  const onResizeWidget = useCallback(
    (id: string, size: WidgetSize) => editWidgets((current) => resizeWidget(current, id, size)),
    [editWidgets],
  );

  const onPlacementsChange = useCallback(
    (placements: GridItemPlacement[]) => editWidgets((current) => applyPlacements(current, placements)),
    [editWidgets],
  );

  return {
    stored,
    setStored,
    widgets,
    queries,
    timeFilter,
    compare,
    isEditing,
    hasChanges,
    isSaving,
    onEdit,
    onDiscard,
    onSave,
    onTimePeriodChange,
    onTimeRangeChange,
    onCompareChange,
    onAddWidget,
    onUpdateWidget,
    onQueriesChange,
    onRetryQuery,
    onRemoveWidget,
    onMoveWidget,
    onResizeWidget,
    onPlacementsChange,
  };
};
