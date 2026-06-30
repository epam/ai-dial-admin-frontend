'use client';

import { FC, useEffect, useRef } from 'react';

import classNames from 'classnames';

import ScoreBar from '@/src/components/Common/ScoreBar/ScoreBar';
import { SCORE_INDICATOR_COMPARE_WIDTH } from '@/src/components/Common/ScoreBar/constants';
import { TRUNCATE_THRESHOLD } from '@/src/components/Runs/Details/BottomDrawer/constants';
import { formatFieldValue } from '@/src/components/Runs/Details/BottomDrawer/utils';

interface Props {
  raw: string | null;
  isFailed?: boolean;
  isScoreIndicator: boolean;
  failedLabel: string;
  onOverflowChange?: (overflowing: boolean) => void;
}

const parseNumericRaw = (raw: string | null): number | null => {
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isNaN(value) ? null : value;
};

const FieldValue: FC<Props> = ({ raw, isFailed, isScoreIndicator, failedLabel, onOverflowChange }) => {
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

  const numericValue = parseNumericRaw(raw);

  if (isScoreIndicator && numericValue != null) {
    return (
      <div className="flex items-center gap-2">
        <ScoreBar value={numericValue} width={SCORE_INDICATOR_COMPARE_WIDTH} />
        <span className="text-primary dial-small-text shrink-0">{numericValue.toFixed(3)}</span>
      </div>
    );
  }

  const displayText = formatFieldValue(raw);
  const isLong = raw !== null && raw.length > TRUNCATE_THRESHOLD;

  return (
    <span
      ref={textRef}
      className={classNames('text-primary dial-small-text line-clamp-4 break-words', isLong && 'whitespace-pre-wrap')}
    >
      {displayText}
    </span>
  );
};

export default FieldValue;
