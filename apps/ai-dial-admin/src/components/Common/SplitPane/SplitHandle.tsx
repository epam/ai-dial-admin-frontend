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
      {/* `bg-secondary` rather than the `bg-tertiary` the Runs drawer's handle reaches for: the palette
          defines `tertiary` as a stroke token only, so that class renders no background at all. */}
      <span
        aria-hidden
        className="h-0.5 w-10 rounded-full bg-secondary opacity-50 group-hover:opacity-100 group-focus-visible:opacity-100"
      />
    </div>
  );
};

export default SplitHandle;
