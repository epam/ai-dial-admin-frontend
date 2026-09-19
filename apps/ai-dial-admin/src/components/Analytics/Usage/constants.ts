import { BreakdownTab, TimeSeriesView, UsageView } from '@/src/components/Analytics/Usage/models';

export const USAGE_ENTITY = 'dial_usage_log';

export const BREAKDOWN_PAGE_SIZE = 7;

export const BREAKDOWN_FULL_PAGE_SIZE = 200;

export const DONUT_SLICE_COUNT = 5;

export const DONUT_SIZE = 200;
export const DONUT_MODAL_SIZE = 260;

/**
 * Rows the share request fetches while only the card is showing: it folds at `DONUT_SLICE_COUNT`
 * and derives its residual from the window total, so the ranked head is all it needs.
 */
export const DONUT_CARD_ROW_LIMIT = DONUT_SLICE_COUNT;

/**
 * Rows it fetches once the full-list dialog is open. "Every entity" is not something the query
 * surface can be asked for — it refuses a limit above 1000 rather than clamping it — so this is
 * that ceiling, and a residual in the dialog now means the dimension genuinely has more than a
 * thousand entities. For scale: MCP servers, the widest dimension here, came to 84 over two days.
 */
export const DONUT_FULL_ROW_LIMIT = 1000;

/** Floor for the plot when its row has nothing taller to stretch it. */
export const TIME_SERIES_MIN_HEIGHT = 250;

/**
 * Rows a bucketed request asks for. The backend applies its own limit of 100 when a query states
 * none — a silent truncation, since the response carries no marker for it — and refuses anything
 * above 1000. Both bucketed shapes therefore state the ceiling: the plain one runs to the chart
 * resolution's own cap of 200 buckets, and the split one to that times its series.
 */
export const BUCKET_ROW_LIMIT = 1000;

export const SPEND_SCALE_THRESHOLD_DAYS = 7;
export const SPEND_DAY_COUNT = 14;
export const SPEND_MONTH_COUNT = 12;

export const SEARCH_DEBOUNCE_MS = 350;

/**
 * Height held for the heatmap while a week loads. The matrix is always seven rows of 20px plus a
 * header, so the figure is fixed — without it the card collapses to the loader and the page below
 * jumps on every step through the weeks.
 */
export const HEATMAP_BODY_HEIGHT = 180;

/** The literal the backend emits for a column with no value; never shown to a reader. */
export const UNDEFINED_VALUE = 'undefined';

/**
 * Which rows each view is about. The empty kind is the Anthropic messages API and the OpenAI
 * responses API — LLM traffic that carries no classified kind, and about a fifth of all rows.
 */
export const USAGE_VIEW_EVENT_KINDS: Record<UsageView, string[]> = {
  [UsageView.Llm]: ['llm_call', 'embedding', ''],
  [UsageView.Mcp]: ['mcp'],
};

/**
 * On an LLM row the model is the `deployment` and the application that called it is
 * `parent_deployment`; there is no separate model column.
 */
export const BREAKDOWN_TAB_COLUMN: Record<BreakdownTab, string> = {
  [BreakdownTab.Models]: 'deployment',
  [BreakdownTab.Applications]: 'parent_deployment',
  [BreakdownTab.Projects]: 'project_id',
  [BreakdownTab.McpServers]: 'deployment',
  [BreakdownTab.Tools]: 'mcp_tool_call_name',
};

/**
 * Which plots a view offers. The MCP view has no spend: an `mcp` row carries no `deployment_price`
 * at all — measured over a week, 76k rows and not one priced — so a Cost tab there would be a flat
 * zero line whatever the window.
 */
export const VIEW_TIME_SERIES_VIEWS: Record<UsageView, TimeSeriesView[]> = {
  [UsageView.Llm]: [TimeSeriesView.Requests, TimeSeriesView.ByDimension, TimeSeriesView.Cost, TimeSeriesView.Latency],
  [UsageView.Mcp]: [TimeSeriesView.Requests, TimeSeriesView.ByDimension, TimeSeriesView.Latency],
};

export const VIEW_BREAKDOWN_TABS: Record<UsageView, BreakdownTab[]> = {
  [UsageView.Llm]: [BreakdownTab.Models, BreakdownTab.Applications, BreakdownTab.Projects],
  [UsageView.Mcp]: [BreakdownTab.McpServers, BreakdownTab.Tools, BreakdownTab.Applications, BreakdownTab.Projects],
};
