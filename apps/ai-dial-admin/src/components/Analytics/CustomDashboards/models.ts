import { ComparePeriod } from '@/src/components/Analytics/Usage/models';
import {
  ChangeDirection,
  DashboardVisibility,
  DashboardWidget,
  WidgetValueFormat,
  WidgetView,
} from '@/src/models/analytics/dashboard';
import { CopiedPersonalQueries } from '@/src/utils/analytics/widget-source';

export interface DashboardDetails {
  name: string;
  description: string;
  // The compare choice the dashboard opens with.
  compare: ComparePeriod;
  visibility: DashboardVisibility;
}

// Where a widget's query comes from, as Add widget offers it.
export enum WidgetSourceKind {
  SavedQuery = 'saved_query',
  Sql = 'sql',
}

// What the widget settings form edits. `rowCount` is the raw field text, so an emptied field and an
// out-of-range number can be told apart until the form is submitted.
export interface WidgetSettings {
  source: WidgetSourceKind;
  savedQueryId: string;
  // The statement of a SQL source; empty for a saved query.
  sql: string;
  title: string;
  description: string;
  rowCount: string;
  view: WidgetView;
  // The aggregate a Single value widget shows, and which way its change is good news.
  valueColumn: string;
  changeDirection: ChangeDirection;
  // How a Single value or Share figure is written, and the currency of a money one.
  valueFormat: WidgetValueFormat;
  currency: string;
}

export interface ValueColumnOption {
  value: string;
  label: string;
}

// What only the widget knows from its latest result: the views it fits and the aggregates it can show.
export interface WidgetResultOptions {
  fittingViews: WidgetView[];
  valueColumns: ValueColumnOption[];
}

// The widget whose settings are open.
export interface EditedWidget extends WidgetResultOptions {
  widget: DashboardWidget;
}

// Details waiting on the publish confirmation, with the names of the personal queries publishing would copy.
export interface PendingPublish {
  details: DashboardDetails;
  copied: CopiedPersonalQueries;
}

export interface WidgetRunState {
  isLoading: boolean;
  hasFailed: boolean;
}

export type NewWidget = Omit<DashboardWidget, 'layout'>;

export interface WidgetPieLayout {
  sliceCount: number;
  legendRowsPerColumn: number;
  donutSize: number;
}
