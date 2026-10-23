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
import { TrendTagPaletteEntry } from '@/src/components/TestSuites/Trends/models';

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

/** CSS class on Metric Trends sticky tooltips (outside-click dismiss). */
export const METRIC_TREND_TOOLTIP_CLASS = 'metric-trend-tooltip';

/** Marker diameter for Overall Score Trend run dots (Figma 8px). */
export const TREND_OVERALL_SYMBOL_SIZE = 8;

/** Marker diameter for Metric Trend series points. */
export const TREND_METRIC_SYMBOL_SIZE = 6;

/** Max chip width when a Metric Trend card has two or more series tags (Figma). */
export const METRIC_TREND_TAG_MAX_WIDTH_PX = 116;

/** Dark Metric Trends tags — Figma Tags Default / Hover. */
export const TREND_TAG_PALETTE_DARK: TrendTagPaletteEntry[] = [
  { stroke: '#E5764A', fill: '#2B0F04', hover: '#59210A' },
  { stroke: '#D4BE3A', fill: '#362A0E', hover: '#403D12' },
  { stroke: '#5E8EFF', fill: '#162446', hover: '#1D346A' },
  { stroke: '#4EC5C5', fill: '#1C3847', hover: '#124B69' },
  { stroke: '#EB503E', fill: '#481719', hover: '#69100B' },
  { stroke: '#30E070', fill: '#1E2A16', hover: '#223513' },
];

/** Light Metric Trends tags — Figma Tags Light Mode (blue stroke `#155BFD`). */
export const TREND_TAG_PALETTE_LIGHT: TrendTagPaletteEntry[] = [
  { stroke: '#E5764A', fill: '#FDECC4', hover: '#F9E3C0' },
  { stroke: '#D4BE3A', fill: '#FAF7DF', hover: '#F5EDA0' },
  { stroke: '#155BFD', fill: '#E3EBFD', hover: '#C5D5FC' },
  { stroke: '#4EC5C5', fill: '#E2F3F6', hover: '#C1EAF2' },
  { stroke: '#EB503E', fill: '#FFECE9', hover: '#FFC9CB' },
  { stroke: '#30E070', fill: '#ECF7EA', hover: '#C8EDBC' },
];

export const TEST_CASE_SEGMENT_BG = {
  above: 'bg-[var(--text-score-abs-11,#30e070)]',
  below: 'bg-[#4DC87A80]',
  errorOrNa: 'bg-[var(--text-score-abs-00,#ff4e50)]',
} as const;

export const TEST_CASE_SEGMENT_HEX = {
  above: '#30e070',
  below: '#4DC87A80',
  errorOrNa: '#ff4e50',
} as const;

export const LATEST_RUN_GAUGE_EMPTY_COLOR = '#242c42';

export const COMBO_TREND_SEGMENT_BG = {
  source: 'bg-[#113ea7]',
  metrics: 'bg-[#7847c5]',
} as const;

export const COMBO_TREND_SEGMENT_HEX = {
  source: '#113ea7',
  metrics: '#7847c5',
} as const;

/** Total-line stroke + dots: Cost (orange) / Runtime (cyan). */
export const COMBO_TREND_LINE_HEX = {
  cost: '#E5764A',
  runtime: '#4EC5C5',
} as const;
