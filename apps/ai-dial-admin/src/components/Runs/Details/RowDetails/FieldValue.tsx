'use client';

import { FC, useEffect, useRef } from 'react';

import classNames from 'classnames';

import ScoreCellValue from '@/src/components/Common/ScoreCell/ScoreCellValue';
import { TRUNCATE_THRESHOLD } from '@/src/components/Runs/Details/BottomDrawer/constants';
import { formatFieldValue } from '@/src/components/Runs/Details/BottomDrawer/utils';
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
}

const FieldValue: FC<Props> = ({
  raw,
  isFailed,
  isScoreIndicator,
  failedLabel,
  onOverflowChange,
  singleLine,
  fill,
}) => {
  const textRef = useRef<HTMLSpanElement>(null);

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
      className={classNames(textClassName, 'line-clamp-4 break-words', isLong && 'whitespace-pre-wrap')}
    >
      {displayText}
    </span>
  );
};

export default FieldValue;
