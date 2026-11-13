import { isEmpty, omit } from 'lodash';

import { WidgetSettings } from '@/src/components/Analytics/CustomDashboards/models';
import { CHART_TYPE_BY_WIDGET_VIEW, DEFAULT_CURRENCY } from '@/src/constants/analytics/dashboards';
import { DashboardWidgetSettings, WidgetValueFormat, WidgetView } from '@/src/models/analytics/dashboard';

export const toStoredWidgetSettings = (
  stored: DashboardWidgetSettings | undefined,
  { view, valueFormat, currency }: WidgetSettings,
): DashboardWidgetSettings | undefined => {
  const isFormatted = view === WidgetView.SingleValue || view === WidgetView.Share;
  const isMoney = isFormatted && valueFormat === WidgetValueFormat.Money;
  const chartType = CHART_TYPE_BY_WIDGET_VIEW[view];
  const settings: DashboardWidgetSettings = {
    ...omit(stored, ['value_format', 'currency', 'chart']),
    ...(chartType ? { chart: { type: chartType } } : {}),
    ...(isFormatted && valueFormat !== WidgetValueFormat.Number ? { value_format: valueFormat } : {}),
    ...(isMoney && currency !== DEFAULT_CURRENCY ? { currency } : {}),
  };
  return isEmpty(settings) ? undefined : settings;
};

export interface WidgetViewPatch {
  view?: WidgetView;
  settings?: DashboardWidgetSettings;
}

/**
 * The view and settings an edited widget stores. A picked chart lives in `settings.chart` with no view, since the
 * service accepts only its own view tokens; a widget that had no view keeps none while its resolved view is
 * submitted unchanged, so it keeps following its query.
 */
export const toWidgetViewPatch = (
  submitted: WidgetSettings,
  stored: DashboardWidgetSettings | undefined,
  resolvedView: WidgetView,
  isViewUnset: boolean,
): WidgetViewPatch => {
  const isViewKept = isViewUnset && submitted.view === resolvedView;
  const form =
    isViewKept && CHART_TYPE_BY_WIDGET_VIEW[submitted.view] ? { ...submitted, view: WidgetView.Query } : submitted;
  const isStoredAsView = !isViewKept && form.view !== WidgetView.Query && !CHART_TYPE_BY_WIDGET_VIEW[form.view];
  return { view: isStoredAsView ? form.view : undefined, settings: toStoredWidgetSettings(stored, form) };
};
