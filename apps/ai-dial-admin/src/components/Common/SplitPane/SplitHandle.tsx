'use client';

/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex --
   The ARIA window-splitter pattern: its separator is focusable and carries a value by definition. Both rules
   exist to catch a plain `div` handed interactive behaviour with no role to explain it — the role, the
   orientation and the value state are exactly what this element has. */

import { FC, KeyboardEvent, useCallback } from 'react';

import { SPLIT_STEP_PERCENT } from '@/src/components/Common/SplitPane/constants';
import { clampSplitPercent, stepSplitPercent } from '@/src/components/Common/SplitPane/utils';

// A lookup rather than a chain of conditions, so adding a key is adding a row. Up shrinks the top section and
// down grows it — the separator moves the way the key points. Home and End ask for the two ends by passing
// values past them; the clamp answers with the floor and its complement.
const NEXT_PERCENT: Record<string, (percent: number, minPercent: number) => number> = {
  ArrowUp: (percent, minPercent) => stepSplitPercent(percent, -SPLIT_STEP_PERCENT, minPercent),
  ArrowDown: (percent, minPercent) => stepSplitPercent(percent, SPLIT_STEP_PERCENT, minPercent),
  Home: (_percent, minPercent) => clampSplitPercent(0, minPercent),
  End: (_percent, minPercent) => clampSplitPercent(100, minPercent),
};

interface Props {
  ariaLabel: string;
  percent: number;
  minPercent: number;
  onChangePercent: (percent: number) => void;
}

const SplitHandle: FC<Props> = ({ ariaLabel, percent, minPercent, onChangePercent }) => {
  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const resolve = NEXT_PERCENT[event.key];

      if (!resolve) {
        return;
      }

      // The arrow keys scroll the section below when they are not claimed here.
      event.preventDefault();
      onChangePercent(resolve(percent, minPercent));
    },
    [percent, minPercent, onChangePercent],
  );

  return (
    // The state a drag produces is the state this reports: `aria-valuenow` is the same number the pointer
    // path commits, so a reader with no pointer reaches every size a reader with one can.
    <div
      role="separator"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-orientation="horizontal"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={Math.round(clampSplitPercent(0, minPercent))}
      aria-valuemax={Math.round(clampSplitPercent(100, minPercent))}
      onKeyDown={onKeyDown}
      className="group flex size-full cursor-ns-resize items-center justify-center outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent-primary"
    >
      {/* `bg-layer-4` is the one ground neither section beside it uses, so the grip is not read as a seam;
          `bg-secondary` for the rules because the palette defines `tertiary` as a stroke token only. */}
      <span
        aria-hidden
        className="flex h-2.5 w-6 flex-col items-center justify-center gap-[2px] rounded-sm border border-primary bg-layer-4 transition-colors group-hover:border-hover group-focus-visible:border-hover"
      >
        <span className="h-px w-3 rounded-full bg-secondary transition-colors group-hover:bg-primary group-focus-visible:bg-primary" />
        <span className="h-px w-3 rounded-full bg-secondary transition-colors group-hover:bg-primary group-focus-visible:bg-primary" />
      </span>
    </div>
  );
};

export default SplitHandle;
