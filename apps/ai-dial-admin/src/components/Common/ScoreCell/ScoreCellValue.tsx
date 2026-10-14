import classNames from 'classnames';
import { FC } from 'react';

import { formatHeatMapCellValueForMode } from '@/src/components/Common/HeatMap/utils/format-heat-map-cell-value';
import { ScoreColorMode } from '@/src/components/Common/ScoreCell/models';
import { getScoreCellBucketClasses, getScoreCellBucketKey } from '@/src/components/Common/ScoreCell/utils';

interface Props {
  value: number;
  mode?: ScoreColorMode;
}

/**
 * Bucket-colored, right-aligned score number for non-grid surfaces (row detail panels), sharing the
 * buckets, colors and number format of `Grid/CellRenderers/ScoreCellRenderer`. It fills its parent, so
 * the caller's cell must be a flex container with no padding of its own. The number stays at the top-right
 * (like the padded text cells around it) however tall the cell grows. It does not size or hide its
 * text by width — a panel cell has a fixed width.
 */
const ScoreCellValue: FC<Props> = ({ value, mode = ScoreColorMode.Absolute }) => {
  const classes = getScoreCellBucketClasses(getScoreCellBucketKey(value, mode));

  return (
    <div
      className={classNames(
        'flex flex-1 items-start justify-end self-stretch min-w-0 p-3 dial-small-text font-semibold',
        classes?.background,
        classes?.text ?? 'text-primary',
      )}
    >
      {formatHeatMapCellValueForMode(value, mode === ScoreColorMode.Delta)}
    </div>
  );
};

export default ScoreCellValue;
