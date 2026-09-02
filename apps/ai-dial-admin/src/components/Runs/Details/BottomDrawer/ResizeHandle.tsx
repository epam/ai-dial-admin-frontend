'use client';

/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex --
   The ARIA window-splitter pattern: its separator is focusable and carries a value by definition. Both rules
   exist to catch a plain `div` handed interactive behaviour with no role to explain it — the role, the
   orientation and the value state are exactly what this element has. */

import { FC, KeyboardEvent, useCallback } from 'react';

import { DRAWER_COARSE_STEP_HEIGHT, DRAWER_STEP_HEIGHT } from '@/src/components/Runs/Details/BottomDrawer/constants';
import { clampDrawerHeight } from '@/src/components/Runs/Details/BottomDrawer/utils';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

// A lookup rather than a chain of conditions, so adding a key is adding a row. The drawer is anchored to the
// bottom and resized from its top edge, so up grows it — the edge moves the way the key points. Every entry
// clamps, so Home and End simply name a bound and an arrow may overshoot one without testing for it first.
// The step arrives from the caller because it is Shift that chooses between the fine one and the coarse one.
const NEXT_HEIGHT: Record<string, (height: number, step: number, min: number, max: number) => number> = {
  ArrowUp: (height, step, min, max) => clampDrawerHeight(height + step, min, max),
  ArrowDown: (height, step, min, max) => clampDrawerHeight(height - step, min, max),
  Home: (_height, _step, min, max) => clampDrawerHeight(min, min, max),
  End: (_height, _step, min, max) => clampDrawerHeight(max, min, max),
};

interface Props {
  height: number;
  minHeight: number;
  maxHeight: number;
  onChangeHeight: (height: number) => void;
}

const ResizeHandle: FC<Props> = ({ height, minHeight, maxHeight, onChangeHeight }) => {
  const t = useI18n();

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const resolve = NEXT_HEIGHT[event.key];

      if (!resolve) {
        return;
      }

      // The arrow keys scroll the drawer's own content when they are not claimed here.
      event.preventDefault();
      onChangeHeight(
        resolve(height, event.shiftKey ? DRAWER_COARSE_STEP_HEIGHT : DRAWER_STEP_HEIGHT, minHeight, maxHeight),
      );
    },
    [height, minHeight, maxHeight, onChangeHeight],
  );

  return (
    // The state a drag produces is the state this reports, clamped to the live bounds: the maximum is derived
    // from the viewport, so a height stored at a taller window would otherwise be announced as a size the
    // drawer is no longer at.
    <div
      role="separator"
      tabIndex={0}
      aria-label={t(RunsI18nKey.ResizeDrawerLabel)}
      aria-orientation="horizontal"
      aria-valuenow={Math.round(clampDrawerHeight(height, minHeight, maxHeight))}
      aria-valuemin={Math.round(minHeight)}
      aria-valuemax={Math.round(Math.max(minHeight, maxHeight))}
      onKeyDown={onKeyDown}
      className="group flex h-2.5 cursor-ns-resize items-center justify-center outline-none transition-colors hover:bg-layer-2 focus-visible:bg-layer-2 focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent-primary"
    >
      {/* `bg-secondary` rather than `bg-tertiary`: the palette defines `tertiary` as a stroke token only, so
          that class rendered no background at all and the grip was invisible. */}
      <div
        aria-hidden
        className="h-1 w-10 rounded-full bg-secondary opacity-50 group-hover:opacity-100 group-focus-visible:opacity-100"
      />
    </div>
  );
};

export default ResizeHandle;
