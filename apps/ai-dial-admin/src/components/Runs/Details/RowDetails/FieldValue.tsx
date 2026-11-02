'use client';

import { FC, useEffect, useRef } from 'react';

import classNames from 'classnames';

import ScoreCellValue from '@/src/components/Common/ScoreCell/ScoreCellValue';
import { TRUNCATE_THRESHOLD } from '@/src/components/Runs/Details/BottomDrawer/constants';
import { formatFieldValue } from '@/src/components/Runs/Details/BottomDrawer/utils';
import { useFittedLineClamp } from '@/src/components/Runs/Details/RowDetails/use-fitted-line-clamp';
import { getScoreFieldValue } from '@/src/components/Runs/Details/RowDetails/utils/score-field-value';

interface Props {
  raw: string | null;
  isFailed?: boolean;
  isScoreIndicator: boolean;
  failedLabel: string;
  onOverflowChange?: (overflowing: boolean) => void;
  singleLine?: boolean;
  /** Wrap within the cell without line-clamp (e.g. stretched pivot value cells). */
  fill?: boolean;
  /** Show the lines that fit the cell height and end the last one with an ellipsis, instead of scrolling like `fill`. */
  isFitted?: boolean;
  /** Line-clamp utility for the default (non-`fill`, non-`singleLine`) layout. */
  clampClassName?: string;
}

const FieldValue: FC<Props> = ({
  raw,
  isFailed,
  isScoreIndicator,
  failedLabel,
  onOverflowChange,
  singleLine,
  fill,
  isFitted,
  clampClassName = 'line-clamp-4',
}) => {
  const textRef = useRef<HTMLSpanElement>(null);
  const { containerRef, lineClamp } = useFittedLineClamp<HTMLDivElement>();

  useEffect(() => {
    const el = textRef.current;
    if (!el) {
      onOverflowChange?.(false);
      return;
    }

    const check = () => onOverflowChange?.(el.scrollHeight > el.clientHeight);
    check();

    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [raw, isFailed, isScoreIndicator, onOverflowChange]);

  if (isFailed) {
    return <span className="text-error dial-small-text">{failedLabel}</span>;
  }

  const scoreValue = getScoreFieldValue(raw, isScoreIndicator);

  if (scoreValue != null) {
    return <ScoreCellValue value={scoreValue} />;
  }

  const displayText = formatFieldValue(raw);
  const isMissing = raw === null;
  const isLong = raw !== null && raw.length > TRUNCATE_THRESHOLD;
  const textClassName = isMissing ? 'text-secondary dial-small-text' : 'text-primary dial-small-text';

  if (singleLine) {
    return <span className={classNames(textClassName, 'truncate min-w-0')}>{displayText}</span>;
  }

  if (isFitted) {
    return (
      <div ref={containerRef} className="flex-1 min-w-0 min-h-0 self-stretch overflow-hidden">
        <span
          className={classNames(textClassName, 'break-words', isLong && 'whitespace-pre-wrap')}
          style={
            lineClamp
              ? { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: lineClamp, overflow: 'hidden' }
              : undefined
          }
        >
          {displayText}
        </span>
      </div>
    );
  }

  if (fill) {
    return (
      <span
        ref={textRef}
        className={classNames(
          textClassName,
          'break-words min-w-0 self-stretch overflow-y-auto',
          isLong && 'whitespace-pre-wrap',
        )}
      >
        {displayText}
      </span>
    );
  }

  return (
    <span
      ref={textRef}
      className={classNames(textClassName, clampClassName, 'break-words', isLong && 'whitespace-pre-wrap')}
    >
      {displayText}
    </span>
  );
};

export default FieldValue;
