export const ROW_DETAIL_SIDEBAR_CLASS = 'w-1/2 p-0';

export const ROW_DETAIL_BOTTOM_CLASS = 'p-0';

export const ROW_DETAIL_DISPLAY_PANEL_CLASS =
  'flex flex-col absolute right-0 top-0 bottom-0 w-[397px] bg-layer-3 border-l border-primary shadow-lg z-20';

export const ROW_DETAIL_PIVOT_LEFT_COL_WIDTH = 212;
export const ROW_DETAIL_PIVOT_STATUS_COL_WIDTH = 135;
export const ROW_DETAIL_PIVOT_RUN_NUMBER_COL_WIDTH = 124;
export const ROW_DETAIL_PIVOT_HTTP_COL_WIDTH = 66;
export const ROW_DETAIL_PIVOT_DURATION_COL_WIDTH = 109;
export const ROW_DETAIL_PIVOT_SCORE_COL_WIDTH = 124;
export const ROW_DETAIL_PIVOT_DEFAULT_COL_WIDTH = 200;

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
