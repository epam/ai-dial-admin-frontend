'use client';

import { ICellRendererParams } from 'ag-grid-community';
import classNames from 'classnames';

import {
  formatHeatMapCellValueForMode,
  shouldShowHeatMapCellValue,
} from '@/src/components/Common/HeatMap/utils/format-heat-map-cell-value';
import { ScoreColorMode } from '@/src/components/Common/ScoreCell/models';
import { getScoreCellBucketClasses, getScoreCellBucketKey } from '@/src/components/Common/ScoreCell/utils';

const MISSING_DISPLAY = '—';

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
 * Border behavior:
 * - Value visible: no border, so neighboring score cells read as one continuous field rather than a
 *   grid of divided boxes.
 * - Value hidden (see `isHidden` below): a right+bottom border in the bucket's visible accent color,
 *   so the grid structure stays legible once the numbers themselves are gone.
 */
const ScoreCellRenderer = ({ value, column, mode = ScoreColorMode.Absolute }: ScoreCellRendererParams) => {
  const columnWidth = column?.getActualWidth();
  const isHidden = columnWidth != null && !shouldShowHeatMapCellValue(columnWidth);

  if (!isScoreValue(value, mode)) {
    const text = value == null || value === MISSING_DISPLAY ? MISSING_DISPLAY : String(value);
    const isMissing = text === MISSING_DISPLAY;
    const isTextHidden = isHidden && isMissing;

    return (
      <div
        className={classNames(
          'flex items-center justify-end size-full overflow-hidden',
          isHidden ? 'border-r border-tertiary' : 'px-3',
        )}
        role={isTextHidden ? 'group' : undefined}
        aria-label={isTextHidden ? MISSING_DISPLAY : undefined}
      >
        {!isTextHidden && (
          <span className={classNames('dial-small-text truncate', isMissing ? 'text-secondary' : 'text-primary')}>
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
        !isHidden && 'px-3',
      )}
      role={isHidden ? 'group' : undefined}
      aria-label={isHidden ? displayText : undefined}
    >
      {!isHidden && (
        <span className={classNames('dial-small-text truncate font-semibold', classes?.text ?? 'text-secondary')}>
          {displayText}
        </span>
      )}
    </div>
  );
};

export default ScoreCellRenderer;
