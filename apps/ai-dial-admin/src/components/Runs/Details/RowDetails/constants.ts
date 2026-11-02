export const ROW_DETAIL_SIDEBAR_CLASS = 'w-1/2 p-0';

export const ROW_DETAIL_BOTTOM_CLASS = 'p-0';

export const ROW_DETAIL_DISPLAY_PANEL_CLASS =
  'flex flex-col absolute right-0 top-0 bottom-0 w-[397px] bg-layer-3 border-l border-primary shadow-lg z-20';

export const ROW_DETAIL_PIVOT_LEFT_COL_WIDTH = 212;
export const ROW_DETAIL_PIVOT_STATUS_COL_WIDTH = 135;
export const ROW_DETAIL_PIVOT_RUN_NUMBER_COL_WIDTH = 124;
export const ROW_DETAIL_PIVOT_HTTP_COL_WIDTH = 66;
export const ROW_DETAIL_PIVOT_DURATION_COL_WIDTH = 140;
export const ROW_DETAIL_PIVOT_SCORE_COL_WIDTH = 124;
export const ROW_DETAIL_PIVOT_DEFAULT_COL_WIDTH = 200;
export const ROW_DETAIL_PIVOT_TEXT_COL_WIDTH = 320;

export const ROW_DETAIL_FIELD_COL_MIN = 212;
export const ROW_DETAIL_HEADER_HEIGHT = 40;
/** Keeps the section toggle row in view when pinning a field below sticky chrome. */
export const ROW_DETAIL_FIELD_SCROLL_MARGIN_TOP = 48;

export const ROW_DETAIL_HEADER_CELL_BASE =
  'sticky top-0 z-10 bg-layer-1 h-10 px-3 border-b border-r border-secondary flex items-center';
/** Height defaults to the compact 28px filter row; callers override it with a later `h-*` class. */
export const ROW_DETAIL_FILTER_CELL_BASE =
  'sticky z-10 bg-layer-2 h-7 border-b border-r border-secondary flex items-center';
export const ROW_DETAIL_FIELD_INDENT = 'pl-16';

export const ROW_DETAIL_EXECUTION_SECTION_KEY = 'execution';
export const ROW_DETAIL_RUN_NUMBER_FIELD_KEY = 'runNumber';
export const ROW_DETAIL_HTTP_FIELD_KEY = 'httpStatusCode';
export const ROW_DETAIL_DURATION_FIELD_KEY = 'execDurationMs';
export const ROW_DETAIL_REQUEST_BODY_FIELD_KEY = 'requestBody';
export const ROW_DETAIL_RESPONSE_BODY_FIELD_KEY = 'responseBody';
export const ROW_DETAIL_RUN_NUMBER_LABEL = '# Run number';
export const ROW_DETAIL_HTTP_LABEL = 'HTTP';

/** Execution Result pivot defaults — Duration hidden; Request/Response bodies visible. */
export const EXECUTION_RESULT_DEFAULT_HIDDEN_FIELDS = new Set<string>([ROW_DETAIL_DURATION_FIELD_KEY]);
