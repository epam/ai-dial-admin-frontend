'use client';

import { FC, useEffect, useRef } from 'react';

import classNames from 'classnames';

import ScoreCellValue from '@/src/components/Common/ScoreCell/ScoreCellValue';
import { TRUNCATE_THRESHOLD } from '@/src/components/Runs/Details/BottomDrawer/constants';
import { formatFieldValue } from '@/src/components/Runs/Details/BottomDrawer/utils';
import ThresholdScoreValue from '@/src/components/Runs/Details/RowDetails/ThresholdScoreValue';
import { getScoreFieldValue } from '@/src/components/Runs/Details/RowDetails/utils/score-field-value';
import { parseScoreRaw } from '@/src/components/Runs/utils/test-case-scores';

interface Props {
  raw: string | null;
  isFailed?: boolean;
  isScoreIndicator: boolean;
  /** Set only for the overall score: a score with a threshold gets its above/below icon. */
  threshold?: number | null;
  failedLabel: string;
  onOverflowChange?: (overflowing: boolean) => void;
  singleLine?: boolean;
  /** Wrap within the cell without line-clamp (e.g. stretched pivot value cells). */
  fill?: boolean;
  /** Line-clamp utility for the default (non-`fill`, non-`singleLine`) layout. */
  clampClassName?: string;
}

const FieldValue: FC<Props> = ({
  raw,
  isFailed,
  isScoreIndicator,
  threshold,
  failedLabel,
  onOverflowChange,
  singleLine,
  fill,
  clampClassName = 'line-clamp-4',
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

  const thresholdScore = parseScoreRaw(raw);
  if (raw != null && threshold != null && thresholdScore != null) {
    return <ThresholdScoreValue raw={raw} score={thresholdScore} threshold={threshold} />;
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
      className={classNames(textClassName, clampClassName, 'break-words', isLong && 'whitespace-pre-wrap')}
    >
      {displayText}
    </span>
  );
};

export default FieldValue;
