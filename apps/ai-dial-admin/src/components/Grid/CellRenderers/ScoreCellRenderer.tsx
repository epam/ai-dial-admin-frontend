'use client';

import { ICellRendererParams } from 'ag-grid-community';
import classNames from 'classnames';

import { HEAT_MAP_VALUE_TIERS } from '@/src/components/Common/HeatMap/constants';
import {
  formatHeatMapCellValueForMode,
  resolveHeatMapValueTier,
} from '@/src/components/Common/HeatMap/utils/format-heat-map-cell-value';
import { resolveHeatMapLayoutWidth } from '@/src/components/Common/HeatMap/utils/heat-map-layout';
import { ScoreColorMode } from '@/src/components/Common/ScoreCell/models';
import { getScoreCellBucketClasses, getScoreCellBucketKey } from '@/src/components/Common/ScoreCell/utils';

const MISSING_DISPLAY = '—';
const DEFAULT_VALUE_TIER = HEAT_MAP_VALUE_TIERS[0];

interface ScoreCellRendererParams extends ICellRendererParams {
  mode?: ScoreColorMode;
}

const isInScoreRange = (value: number, mode: ScoreColorMode): boolean =>
  mode === ScoreColorMode.Delta ? value >= -1 && value <= 1 : value >= 0 && value <= 1;

const isScoreValue = (value: unknown, mode: ScoreColorMode): value is number =>
  typeof value === 'number' && !Number.isNaN(value) && isInScoreRange(value, mode);

/**
 * Right-aligned number on a bucket-colored background — the shared `score-cell-rendering` contract
 * for Extraction Result's metric columns and the Heat Map's/Stability's value cells. Replaces
 * `MetricScoreCellRenderer` (progress bar) and `Common/HeatMap/HeatMapValueCellRenderer` (whose
 * coloring came from a separate `cellStyle` callback) with one renderer that owns both the text and
 * the color. Colors are Tailwind `score-*` tokens (`tailwind.config.js`), not computed here — see
 * `Common/ScoreCell/utils.ts`.
 *
 * Text size: steps down 14px → 12px → 10px as the column narrows (`HEAT_MAP_VALUE_TIERS`), and is hidden
 * once even 10px would crop.
 *
 * Border behavior:
 * - Value visible: no border, so neighboring score cells read as one continuous field rather than a
 *   grid of divided boxes.
 * - Value hidden (see `isHidden` below): a right+bottom border in the bucket's visible accent color,
 *   so the grid structure stays legible once the numbers themselves are gone.
 * - Missing value (the dash) or zero delta: a neutral right border, hidden or not — neither has a
 *   bucket color, so without it adjacent ones would merge into one blank area.
 */
const ScoreCellRenderer = ({ value, column, context, mode = ScoreColorMode.Absolute }: ScoreCellRendererParams) => {
  const columnWidth = resolveHeatMapLayoutWidth(context, column);
  const tier =
    columnWidth == null ? DEFAULT_VALUE_TIER : resolveHeatMapValueTier(columnWidth, mode === ScoreColorMode.Delta);
  const isHidden = tier == null;

  if (!isScoreValue(value, mode)) {
    const text = value == null || value === MISSING_DISPLAY ? MISSING_DISPLAY : String(value);
    const isMissing = text === MISSING_DISPLAY;
    const isTextHidden = isHidden && isMissing;

    return (
      <div
        className={classNames(
          'flex items-center justify-end size-full overflow-hidden border-r border-tertiary',
          tier?.paddingClassName,
        )}
        role={isTextHidden ? 'group' : undefined}
        aria-label={isTextHidden ? MISSING_DISPLAY : undefined}
      >
        {!isTextHidden && (
          <span
            className={classNames(
              (tier ?? DEFAULT_VALUE_TIER).textClassName,
              'truncate',
              isMissing ? 'text-secondary' : 'text-primary',
            )}
          >
            {text}
          </span>
        )}
      </div>
    );
  }

  const bucketKey = getScoreCellBucketKey(value, mode);
  const classes = getScoreCellBucketClasses(bucketKey);
  const displayText = formatHeatMapCellValueForMode(value, mode === ScoreColorMode.Delta);
  const isZeroDelta = mode === ScoreColorMode.Delta && value === 0;

  const borderClasses = isHidden && classes ? classNames(classes.border, 'border-r border-b') : undefined;
  const isBorderless = !isHidden && !isZeroDelta;
  const zeroDeltaClasses = isZeroDelta ? 'bg-layer-2 border-r border-tertiary' : undefined;

  return (
    <div
      className={classNames(
        'flex items-center justify-end size-full overflow-hidden',
        classes?.background,
        isBorderless && 'border-none',
        borderClasses,
        zeroDeltaClasses,
        tier?.paddingClassName,
      )}
      role={isHidden ? 'group' : undefined}
      aria-label={isHidden ? displayText : undefined}
    >
      {tier && (
        <span className={classNames(tier.textClassName, 'truncate font-semibold', classes?.text ?? 'text-secondary')}>
          {displayText}
        </span>
      )}
    </div>
  );
};

export default ScoreCellRenderer;
