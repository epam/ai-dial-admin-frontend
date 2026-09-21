'use client';

import { FC } from 'react';

import classNames from 'classnames';

interface Props {
  /** Fraction of the whole, 0–1. Values outside the range are clamped. */
  value: number;
  className?: string;
}

const clamp = (value: number): number => Math.min(1, Math.max(0, value));

/**
 * A neutral proportion bar. Unlike `ScoreBar`, the fill colour does not depend on the value: a small
 * share is a small share, not a bad one.
 */
const ShareBar: FC<Props> = ({ value, className }) => (
  <span className={classNames('block h-1.5 w-full overflow-hidden rounded-sm bg-layer-4', className)} aria-hidden>
    <span className="block h-full rounded-sm bg-accent-primary" style={{ width: `${clamp(value) * 100}%` }} />
  </span>
);

export default ShareBar;
