'use client';

import { FC, useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';
import {
  IconArrowDown,
  IconArrowUp,
  IconDotsVertical,
  IconExternalLink,
  IconLayoutGrid,
  IconSettings,
  IconTrashX,
} from '@tabler/icons-react';
import { GhostButton, Spinner } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import { useDashboardWidgetData } from '@/src/components/Analytics/CustomDashboards/Widget/use-dashboard-widget-data';
import { WidgetResultOptions } from '@/src/components/Analytics/CustomDashboards/models';
import SingleValueWidget from '@/src/components/Analytics/CustomDashboards/Widget/SingleValueWidget';
import { useWidgetSparkline } from '@/src/components/Analytics/CustomDashboards/Widget/use-widget-sparkline';
import WidgetResult from '@/src/components/Analytics/CustomDashboards/Widget/WidgetResult';
import DashboardCard from '@/src/components/Analytics/Usage/Card/DashboardCard';
import UsageEmptyState from '@/src/components/Analytics/Usage/Empty/UsageEmptyState';
import { MAX_WIDGET_ROWS, WIDGET_MENU_SIZES } from '@/src/constants/analytics/dashboards';
import {
  isComparingView,
  getFittingViews,
  getWidgetView,
  hasQueryView,
  resolveWidgetView,
} from '@/src/components/Analytics/CustomDashboards/utils/widget-views';
import { ComparePeriod } from '@/src/components/Analytics/Usage/models';
import { getWeekRange } from '@/src/components/Analytics/Usage/utils/weeks';
import { buildComparedWindows } from '@/src/components/Analytics/Usage/utils/windows';
import ActionsDropdown from '@/src/components/Common/ActionsDropdown/ActionsDropdown';
import FieldCaveat from '@/src/components/Common/FieldCaveat/FieldCaveat';
import { CustomDashboardsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';
import {
  ChangeDirection,
  DashboardWidget,
  WidgetMoveDirection,
  WidgetQuery,
  WidgetQueryKind,
  WidgetSize,
  WidgetView,
} from '@/src/models/analytics/dashboard';
import { TimeRange } from '@/src/models/time-range';
import { ApplicationRoute } from '@/src/types/routes';
import { getWidgetQuerySource } from '@/src/utils/analytics/widget-source';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';

// The drag handle the grid listens on; the menu trigger inside it is excluded so it opens instead of dragging.
export const WIDGET_DRAG_HANDLE_CLASS = 'dashboard-widget-drag-handle';

const SIZE_LABEL_KEY: Record<(typeof WIDGET_MENU_SIZES)[number], CustomDashboardsI18nKey> = {
  [WidgetSize.Small]: CustomDashboardsI18nKey.SizeSmall,
  [WidgetSize.Medium]: CustomDashboardsI18nKey.SizeMedium,
  [WidgetSize.Large]: CustomDashboardsI18nKey.SizeLarge,
};

interface Props {
  widget: DashboardWidget;
  widgetQuery?: WidgetQuery;
  range: TimeRange;
  period?: string;
  compare: ComparePeriod;
  refreshToken?: number;
  isEditing: boolean;
  isFirst: boolean;
  isLast: boolean;
  onEditSettings: (id: string, options: WidgetResultOptions) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: WidgetMoveDirection) => void;
  onResize: (id: string, size: WidgetSize) => void;
  // Told whenever the widget becomes, or stops being, unavailable to its viewer.
  onDeniedChange?: (id: string, isDenied: boolean) => void;
  onLoadingChange?: (id: string, isLoading: boolean) => void;
  // Resolves the widget's query again when resolving it failed.
  onRetryQuery?: (widget: DashboardWidget) => void;
}

const WidgetCard: FC<Props> = ({
  widget,
  widgetQuery,
  range,
  period,
  compare,
  refreshToken,
  isEditing,
  isFirst,
  isLast,
  onEditSettings,
  onRemove,
  onMove,
  onResize,
  onDeniedChange,
  onLoadingChange,
  onRetryQuery,
}) => {
  const t = useI18n();
  const router = useRouter();
  const isComposite = widgetQuery?.kind === WidgetQueryKind.CompositeSql;
  const savedQuery = getWidgetQuerySource(widgetQuery);
  const storedView = getWidgetView(widget);
  const isQueryViewOffered = hasQueryView(widget, savedQuery);

  // Decided from the stored view, before the result says whether it fits: a view that stopped fitting
  // costs one unused run rather than a second round trip after the first answer.
  const isComparing = compare !== ComparePeriod.Off && !isComposite && isComparingView(storedView, savedQuery);
  const previousRange = useMemo(
    () => (isComparing ? buildComparedWindows(range, compare).previous : undefined),
    [isComparing, range, compare],
  );

  // A heatmap reads the calendar week holding the range's end, as the usage heatmap does, at the widget maximum so a week of hours fits; decided from
  // the stored view, like the compared run.
  const [isHeatmapRefused, setIsHeatmapRefused] = useState(false);
  const isHeatmap = widget.view === WidgetView.Heatmap && !isHeatmapRefused;
  useEffect(() => setIsHeatmapRefused(false), [widget.view]);
  const heatmapWeek = useMemo(() => getWeekRange(0, range.endDate), [range]);

  const { result, meta, previousResult, isLoading, hasFailed, isDenied, onRetry } = useDashboardWidgetData({
    widgetQuery,
    rowLimit: isHeatmap ? MAX_WIDGET_ROWS : widget.row_limit,
    range: isHeatmap ? heatmapWeek : range,
    period: isHeatmap ? undefined : period,
    previousRange,
    refreshToken,
  });

  useEffect(() => {
    onLoadingChange?.(widget.id, isLoading);
  }, [onLoadingChange, widget.id, isLoading]);
  useEffect(() => () => onLoadingChange?.(widget.id, false), [onLoadingChange, widget.id]);

  useEffect(() => {
    onDeniedChange?.(widget.id, isDenied);
  }, [onDeniedChange, widget.id, isDenied]);

  // A refused widget names nothing of its query, so a readable query refused its data looks like an unreadable one —
  // and until its first answer nobody knows it is not refused, so it names nothing then either.
  const isKnownReadable = !isDenied && (result !== null || hasFailed);
  const queryName = isKnownReadable ? savedQuery?.name || widget.inline_query?.name : undefined;
  const title = widget.title || queryName || t(CustomDashboardsI18nKey.SavedQuery);

  // Until the first answer there is nothing to judge, so the stored view stands: settings opened that early
  // must not offer only the query's own view and write the stored one away.
  const fittingViews = useMemo(() => {
    if (result && meta) return getFittingViews(meta, result.rows, isComposite, isQueryViewOffered);
    const queryViews = isQueryViewOffered ? [WidgetView.Query] : [];
    if (storedView && storedView !== WidgetView.Query) return [...queryViews, storedView];
    return isQueryViewOffered ? queryViews : [WidgetView.Table];
  }, [result, meta, isComposite, isQueryViewOffered, storedView]);
  const view = resolveWidgetView(storedView, fittingViews, savedQuery);
  useEffect(() => {
    if (isHeatmap && result && view !== WidgetView.Heatmap) setIsHeatmapRefused(true);
  }, [isHeatmap, result, view]);

  const singleValueColumn = widget.value_column ?? meta?.aggregateColumns[0] ?? '';
  const sparkline = useWidgetSparkline({
    widgetQuery,
    column: singleValueColumn,
    range,
    period,
    isEnabled: widget.view === WidgetView.SingleValue,
    refreshToken,
  });

  const resultOptions = useMemo(
    (): WidgetResultOptions => ({
      fittingViews,
      valueColumns: (meta?.aggregateColumns ?? []).map((column) => ({
        value: column,
        label: meta?.columnLabels[column] ?? column,
      })),
    }),
    [fittingViews, meta],
  );

  const actions = useMemo(() => {
    const savedQueryId = widget.saved_query_id;
    // An inline query has no page to open, and a refused one offers none either, as an unreadable one does not.
    const items: ActionMenuOperationDeclaration<object>[] =
      savedQueryId && !isDenied
        ? [
            {
              id: 'open-query',
              label: CustomDashboardsI18nKey.OpenQuery,
              icon: <IconExternalLink {...BASE_BUTTON_ICON_PROPS} aria-hidden />,
              disabled: !savedQuery || !isKnownReadable,
              onClick: () => router.push(getUrnForEntity(ApplicationRoute.AnalyticsQueries, { id: savedQueryId })),
            },
          ]
        : [];
    if (!isEditing) return items;

    const sizeItem = (size: WidgetSize, label: CustomDashboardsI18nKey): ActionMenuOperationDeclaration<object> => ({
      id: `size-${size}`,
      label,
      icon: <IconLayoutGrid {...BASE_BUTTON_ICON_PROPS} aria-hidden />,
      onClick: () => onResize(widget.id, size),
    });

    return [
      ...items,
      {
        id: 'settings',
        label: CustomDashboardsI18nKey.WidgetSettings,
        icon: <IconSettings {...BASE_BUTTON_ICON_PROPS} aria-hidden />,
        onClick: () => onEditSettings(widget.id, resultOptions),
      },
      {
        id: 'move-up',
        label: CustomDashboardsI18nKey.MoveUp,
        icon: <IconArrowUp {...BASE_BUTTON_ICON_PROPS} aria-hidden />,
        disabled: isFirst,
        onClick: () => onMove(widget.id, WidgetMoveDirection.Up),
      },
      {
        id: 'move-down',
        label: CustomDashboardsI18nKey.MoveDown,
        icon: <IconArrowDown {...BASE_BUTTON_ICON_PROPS} aria-hidden />,
        disabled: isLast,
        onClick: () => onMove(widget.id, WidgetMoveDirection.Down),
      },
      ...(widget.view === WidgetView.SingleValue
        ? []
        : WIDGET_MENU_SIZES.map((size) => sizeItem(size, SIZE_LABEL_KEY[size]))),
      {
        id: 'remove',
        label: CustomDashboardsI18nKey.RemoveWidget,
        icon: <IconTrashX {...BASE_BUTTON_ICON_PROPS} aria-hidden />,
        onClick: () => onRemove(widget.id),
      },
    ];
  }, [
    savedQuery,
    isDenied,
    isKnownReadable,
    isEditing,
    isFirst,
    isLast,
    widget.id,
    widget.saved_query_id,
    widget.view,
    resultOptions,
    router,
    onEditSettings,
    onMove,
    onResize,
    onRemove,
  ]);

  // A menu whose every item is unavailable — Open query before its query is known — is left out.
  const hasMenu = actions.some((item) => !item.disabled);
  const menu = hasMenu && (
    <ActionsDropdown
      items={actions}
      icon={<IconDotsVertical {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
      actionTriggerClassName="flex size-6 items-center justify-center rounded text-secondary hover:bg-accent-primary-alpha focus-visible:bg-accent-primary-alpha"
    />
  );

  // A single figure is the usage dashboard's KPI card, header and all; while its first answer is on its way
  // the stored view decides, so the card does not flash through the generic frame.
  const isSingleValue =
    !hasFailed && !isDenied && (view === WidgetView.SingleValue || (!result && widget.view === WidgetView.SingleValue));
  if (isSingleValue) {
    const column = singleValueColumn;
    return (
      <SingleValueWidget
        title={widget.title || meta?.columnLabels[column] || column || title}
        description={widget.description}
        column={column}
        result={result}
        previousResult={isComparing ? previousResult : null}
        compare={compare}
        isLoading={isLoading || !result}
        sparkline={sparkline}
        isRiseGood={widget.change_direction !== ChangeDirection.LowerIsBetter}
        valueFormat={widget.settings?.value_format}
        currency={widget.settings?.currency}
        menu={menu}
        dragHandleClassName={isEditing ? WIDGET_DRAG_HANDLE_CLASS : undefined}
      />
    );
  }

  // A query that failed to resolve has nothing to run until it is resolved again.
  const onRetryWidget = () => {
    if (widgetQuery?.kind === WidgetQueryKind.Failed) onRetryQuery?.(widget);
    else onRetry();
  };

  const renderBody = () => {
    // Nothing of the query or its data, and no Retry: a second try would be refused the same way.
    if (isDenied) {
      return <UsageEmptyState title={t(CustomDashboardsI18nKey.WidgetUnavailable)} className="size-full" />;
    }
    if (hasFailed) {
      return (
        <div className="flex size-full flex-col items-center justify-center gap-2">
          <UsageEmptyState title={t(CustomDashboardsI18nKey.WidgetLoadFailed)} />
          <GhostButton label={t(CustomDashboardsI18nKey.Retry)} onClick={onRetryWidget} />
        </div>
      );
    }
    if (isLoading || !result || !meta || !savedQuery) return <Spinner size={30} fullWidth />;
    return (
      <WidgetResult
        savedQuery={savedQuery}
        result={result}
        meta={meta}
        view={view}
        previousResult={isComparing ? previousResult : null}
        compare={compare}
        heatmapWeek={heatmapWeek}
        valueFormat={widget.settings?.value_format}
        currency={widget.settings?.currency}
        isRiseGood={widget.change_direction !== ChangeDirection.LowerIsBetter}
      />
    );
  };

  // The usage dashboard's own card, so a widget and a usage card are drawn by the same code.
  return (
    <DashboardCard
      title={title}
      subtitle={widget.description}
      isSubtitleSingleLine
      className="size-full min-h-0 overflow-hidden"
      headerClassName={classNames(isEditing && [WIDGET_DRAG_HANDLE_CLASS, 'cursor-move'])}
      titleActions={
        isComposite && isKnownReadable && <FieldCaveat hint={t(CustomDashboardsI18nKey.CompositeSqlHint)} />
      }
      headerActions={menu}
    >
      <div className="flex min-h-0 flex-1 flex-col justify-center">{renderBody()}</div>
    </DashboardCard>
  );
};

export default WidgetCard;
