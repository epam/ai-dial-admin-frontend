import { CustomDashboardsI18nKey } from '@/src/constants/i18n';
import { DashboardCreatePermissions, WidgetPlacement, WidgetSize, WidgetView } from '@/src/models/analytics/dashboard';
import { ChartType } from '@/src/models/analytics/query-builder';

export const DASHBOARD_GRID_COLUMNS = 12;

export const NO_DASHBOARD_CREATE_PERMISSIONS: DashboardCreatePermissions = {
  create_private: false,
  create_public: false,
};

export const MIN_WIDGET_ROWS = 1;

// The service's largest page: it refuses a bigger one rather than clamping it.
export const MAX_WIDGET_ROWS = 1000;

export const DEFAULT_WIDGET_ROWS = 100;

// Width × height in grid units for each size the widget menu offers.
export const WIDGET_SIZE_DIMENSIONS: Record<WidgetSize, Pick<WidgetPlacement, 'w' | 'h'>> = {
  // One figure, sized like a usage dashboard KPI card: four to a row.
  [WidgetSize.ExtraSmall]: { w: 3, h: 2 },
  [WidgetSize.Small]: { w: 4, h: 3 },
  [WidgetSize.Medium]: { w: 6, h: 4 },
  [WidgetSize.Large]: { w: 12, h: 4 },
};

export const DEFAULT_WIDGET_SIZE = WidgetSize.Medium;

// A Single value widget always takes this size and offers no other; no other view takes it.
export const SINGLE_VALUE_WIDGET_SIZE = WidgetSize.ExtraSmall;

// The sizes a widget's menu offers to every view but Single value, smallest first.
export const WIDGET_MENU_SIZES = [WidgetSize.Small, WidgetSize.Medium, WidgetSize.Large] as const;

// The query parameter that opens a custom dashboard in edit mode, set when the dashboard was just created.
export const DASHBOARD_EDIT_PARAM = 'edit';

// The switcher's option for the built-in usage dashboard; custom dashboard ids never take this form.
export const USAGE_DASHBOARD_OPTION = '__usage__';

// In the order the View picker lists them.
export const WIDGET_VIEW_LABEL_KEY: Record<WidgetView, CustomDashboardsI18nKey> = {
  [WidgetView.Query]: CustomDashboardsI18nKey.ViewQuery,
  [WidgetView.Table]: CustomDashboardsI18nKey.ViewTable,
  [WidgetView.SingleValue]: CustomDashboardsI18nKey.ViewSingleValue,
  [WidgetView.TimeSeries]: CustomDashboardsI18nKey.ViewTimeSeries,
  [WidgetView.Share]: CustomDashboardsI18nKey.ViewShare,
  [WidgetView.Heatmap]: CustomDashboardsI18nKey.ViewHeatmap,
  [WidgetView.BarChart]: CustomDashboardsI18nKey.ViewBarChart,
  [WidgetView.LineChart]: CustomDashboardsI18nKey.ViewLineChart,
  [WidgetView.ScatterChart]: CustomDashboardsI18nKey.ViewScatterChart,
};

export const CHART_TYPE_BY_WIDGET_VIEW: Partial<Record<WidgetView, ChartType>> = {
  [WidgetView.BarChart]: ChartType.Bar,
  [WidgetView.LineChart]: ChartType.Line,
  [WidgetView.ScatterChart]: ChartType.Scatter,
};

export const WIDGET_VIEW_BY_CHART_TYPE: Record<ChartType, WidgetView> = {
  [ChartType.Bar]: WidgetView.BarChart,
  [ChartType.Line]: WidgetView.LineChart,
  [ChartType.Pie]: WidgetView.Share,
  [ChartType.Scatter]: WidgetView.ScatterChart,
};

export const DEFAULT_CURRENCY = 'USD';

// The currencies the widget settings offer, in the order they are listed.
export const WIDGET_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'PLN'];

// What the service answers a read the caller may not make; a saved query it may not see answers 404.
export const WIDGET_DENIED_STATUSES = [403, 404];
