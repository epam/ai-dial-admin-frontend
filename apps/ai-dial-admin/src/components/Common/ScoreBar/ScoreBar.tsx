'use client';

import { FC } from 'react';

import classNames from 'classnames';

import { SCORE_INDICATOR_DEFAULT_WIDTH } from './constants';
import { getScoreIndicatorColor, getScoreIndicatorFillRatio } from './utils';

interface Props {
  value: number;
  className?: string;
  width?: number;
}

const ScoreBar: FC<Props> = ({ value, className, width = SCORE_INDICATOR_DEFAULT_WIDTH }) => {
  const fillRatio = getScoreIndicatorFillRatio(value);
  const fillColor = getScoreIndicatorColor(value);

  return (
    <div
      className={classNames('h-1 rounded-sm bg-layer-1 overflow-hidden shrink-0', className)}
      style={{ width }}
      aria-hidden
    >
      {fillRatio > 0 && (
        <div
          className="h-full rounded-sm"
          style={{
            width: `${fillRatio * 100}%`,
            backgroundColor: fillColor,
          }}
        />
      )}
    </div>
  );
};

export default ScoreBar;
