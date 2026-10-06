import {
  METRIC_NAME_FIELD,
  METRIC_SCORE_NAME_FIELD,
  METRIC_SCORE_RESULTS_ENTITY,
  OVERALL_METRIC_SCORE_NAME,
  PASSED_FIELD,
  RUN_ID_FIELD,
  TEST_CASE_EVAL_SCORES_ENTITY,
  VALUE_FIELD,
} from '@/src/components/Runs/Summary/constants';
import { fallbackDarkTheme } from '@/src/utils/themes/constant';

export {
  METRIC_NAME_FIELD,
  METRIC_SCORE_NAME_FIELD,
  METRIC_SCORE_RESULTS_ENTITY,
  OVERALL_METRIC_SCORE_NAME,
  PASSED_FIELD,
  RUN_ID_FIELD,
  TEST_CASE_EVAL_SCORES_ENTITY,
  VALUE_FIELD,
};

export const TEST_SUITE_ID_FIELD = 'test_suite_id';
export const COMPUTED_AT_MS_FIELD = 'computed_at_ms';
export const LAST_COMPUTED_ALIAS = 'last_computed';
export const TEST_CASE_NAME_FIELD = 'test_case_name';
export const SCORE_FIELD = 'score';

/** Number of most recently computed runs included in the Trends window. */
export const TRENDS_RUN_WINDOW = 10;

/** Cap on metric_score_results rows returned for the Trends window. */
export const TRENDS_SCORE_ROW_LIMIT = 1000;

/** Cap on test_case_eval_scores rows for Test Case Stability (BE contract). */
export const TRENDS_STABILITY_ROW_LIMIT = 200;

/** CSS class on the Overall Score Trend sticky tooltip (outside-click dismiss). */
export const OVERALL_SCORE_TREND_TOOLTIP_CLASS = 'overall-score-trend-tooltip';

/** Overall Score Trend line and passed-run marker. */
export const TREND_OVERALL_PASSED_COLOR = fallbackDarkTheme['text-accent-primary'];

/** Failed-run marker on Overall Score Trend (text-error fallback). */
export const TREND_OVERALL_FAILED_COLOR = fallbackDarkTheme['text-error'];

/** Horizontal grid lines on Overall Score Trend (Figma Line 7 / Line 12). */
export const TREND_OVERALL_GRID_LINE_COLOR = fallbackDarkTheme['bg-layer-1'];

/** Marker diameter for Overall Score Trend run dots (Figma 8px). */
export const TREND_OVERALL_SYMBOL_SIZE = 8;

export const TREND_SERIES_COLORS = [
  '#E5764A',
  '#D4BE3A',
  '#5E8EFF',
  '#4EC5C5',
  '#EB503E',
  '#30E070',
  '#A78BFA',
  '#FF6B6B',
];

export const TREND_TAG_BG_COLORS = [
  'rgba(229, 118, 74, 0.15)',
  'rgba(212, 190, 58, 0.15)',
  'rgba(94, 142, 255, 0.15)',
  'rgba(78, 197, 197, 0.15)',
  'rgba(235, 80, 62, 0.15)',
  'rgba(48, 224, 112, 0.15)',
  'rgba(167, 139, 250, 0.15)',
  'rgba(255, 107, 107, 0.15)',
];
