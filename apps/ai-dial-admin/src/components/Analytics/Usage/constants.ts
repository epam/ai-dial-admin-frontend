import { BreakdownTab, TimeSeriesView, UsageView } from '@/src/components/Analytics/Usage/models';

export const USAGE_ENTITY = 'dial_usage_log';

/**
 * Rows the card's breakdown states. Ten is the ranked head a reader can take in without scrolling
 * the card, and it is the whole of the card's story: the full list lives in the dialog.
 */
export const BREAKDOWN_PAGE_SIZE = 10;

/**
 * Rows the dialog reads per block as it is scrolled. The full list is not one request: a dimension
 * can hold more rows than the service will answer in one page, and a reader who opened the dialog
 * to look at the head should not wait for the tail.
 */
export const DIALOG_BLOCK_SIZE = 25;

/** The dialog's search is a live field, and every term it reports is a request. */
export const SEARCH_DEBOUNCE_MS = 350;

export const DONUT_SLICE_COUNT = 5;

export const DONUT_SIZE = 200;
export const DONUT_MODAL_SIZE = 260;

/**
 * Rows the share request fetches while only the card is showing: it folds at `DONUT_SLICE_COUNT`
 * and derives its residual from the window total, so the ranked head is all it needs.
 */
export const DONUT_CARD_ROW_LIMIT = DONUT_SLICE_COUNT;

/**
 * The ceiling the query surface itself imposes: it refuses a limit above this rather than clamping
 * it, so a dialog that pages its way down stops here.
 */
export const QUERY_ROW_LIMIT = 1000;

/** A KPI card narrower than this stops being readable, and is what decides how many fit a row. */
export const KPI_CARD_MIN_WIDTH = 196;

/**
 * Floor for the plot when its row has nothing taller to stretch it. Tall enough for the value axis
 * to space its ticks: at the old floor a window with a spike crammed five labels into the top
 * third and left the line reading as a flat rule.
 */
export const TIME_SERIES_MIN_HEIGHT = 300;

/**
 * Rows a bucketed request asks for. The backend applies its own limit of 100 when a query states
 * none — a silent truncation, since the response carries no marker for it — and refuses anything
 * above 1000. Both bucketed shapes therefore state the ceiling: the plain one runs to the chart
 * resolution's own cap of 200 buckets, and the split one to that times its series.
 */
export const BUCKET_ROW_LIMIT = 1000;

/**
 * Height held for the heatmap while a week loads. The matrix is always seven rows of 20px plus a
 * header, so the figure is fixed — without it the card collapses to the loader and the page below
 * jumps on every step through the weeks.
 */
export const HEATMAP_BODY_HEIGHT = 180;

/**
 * An hour column narrower than this leaves the shared row height looking like a sliver, so the
 * rows grow to bring the cell back towards square. Measured on the column rather than on the card,
 * because the column is the thing that looks flat — and it stays right if the day column's width
 * or the hour count ever changes.
 */
export const HEATMAP_FLAT_COLUMN_WIDTH = 56;
export const HEATMAP_NARROW_ROW_HEIGHT = 28;

/** Roughly the grid's own header row, so the reserved height covers it. */
export const HEATMAP_HEADER_HEIGHT = 40;

/** The literal the backend emits for a column with no value; never shown to a reader. */
export const UNDEFINED_VALUE = 'undefined';

/**
 * Which rows each view is about. The empty kind is the Anthropic messages API and the OpenAI
 * responses API — LLM traffic that carries no classified kind, and about a fifth of all rows.
 */
/**
 * The MCP view is about tool execution, and `tools/call` is the only method that executes anything.
 * Measured on the live dataset, it is 13% of `mcp` rows: the rest is the handshake and discovery a
 * client fires per connection — `initialize`, `notifications/initialized`, `tools/list`,
 * `resources/list`. Counting those as calls made the view rank servers by how often clients
 * connected to them, and made its error rate and latency describe handshakes rather than work.
 */
export const MCP_TOOL_CALL_METHOD = 'tools/call';

export const USAGE_VIEW_EVENT_KINDS: Record<UsageView, string[]> = {
  [UsageView.Llm]: ['llm_call', 'embedding', ''],
  [UsageView.Mcp]: ['mcp'],
};

/**
 * On an LLM row the model is the `deployment` and the application that called it is
 * `parent_deployment`; there is no separate model column.
 */
/**
 * The column a tab's rows are qualified by, where its own dimension does not identify a row on its
 * own. A tool name is not unique: `execute_python` exists on several MCP servers and they are
 * different tools, so the tab groups by the server as well and states it under the name.
 */
export const BREAKDOWN_TAB_QUALIFIER: Partial<Record<BreakdownTab, string>> = {
  [BreakdownTab.Tools]: 'deployment',
};

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
