'use client';

import { ResizeCallback, Resizable } from 're-resizable';
import { FC, ReactNode, useCallback, useRef, useState } from 'react';

import SplitHandle from '@/src/components/Common/SplitPane/SplitHandle';
import { DEFAULT_SPLIT_PERCENT, MIN_SPLIT_PERCENT } from '@/src/components/Common/SplitPane/constants';
import { clampSplitPercent } from '@/src/components/Common/SplitPane/utils';

interface Props {
  top: ReactNode;
  bottom: ReactNode;
  // Names the separator, not the pane: this component holds no i18n key of its own.
  ariaLabel: string;
  minPercent?: number;
}

/**
 * Two stacked sections with a draggable separator, each floored at a proportion of the available height.
 *
 * The size is held as a **percentage**, and `re-resizable` is given percentage bounds so it resolves them
 * against the live parent. A pixel height would satisfy the floor at one viewport height and violate it at a
 * shorter one, leaving a section smaller than the floor exists to permit.
 */
const SplitPane: FC<Props> = ({ top, bottom, ariaLabel, minPercent = MIN_SPLIT_PERCENT }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [percent, setPercent] = useState(DEFAULT_SPLIT_PERCENT);

  // The effective floor, not the requested one, so the bounds handed to the library and the bounds the
  // separator reports cannot disagree about a floor the clamp capped.
  const floor = clampSplitPercent(0, minPercent);
  const ceiling = clampSplitPercent(100, minPercent);

  const onResizeStop: ResizeCallback = useCallback(
    (_event, _direction, element) => {
      const available = containerRef.current?.clientHeight ?? 0;

      // Nothing to divide, so nothing to commit — the drag would otherwise be stored as a division by zero.
      if (available <= 0) {
        return;
      }

      setPercent(clampSplitPercent((element.getBoundingClientRect().height / available) * 100, minPercent));
    },
    [minPercent],
  );

  return (
    <div ref={containerRef} className="flex min-h-0 flex-1 flex-col">
      <Resizable
        size={{ width: '100%', height: `${percent}%` }}
        minHeight={`${floor}%`}
        maxHeight={`${ceiling}%`}
        enable={{ bottom: true }}
        handleComponent={{
          bottom: (
            <SplitHandle ariaLabel={ariaLabel} percent={percent} minPercent={floor} onChangePercent={setPercent} />
          ),
        }}
        onResizeStop={onResizeStop}
        className="flex min-h-0 flex-col overflow-hidden"
      >
        {top}
      </Resizable>
      {/* The handle is absolutely positioned over this boundary and takes no layout space, so the border is
          what makes the split visible when the separator is neither hovered nor focused. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-primary">{bottom}</div>
    </div>
  );
};

export default SplitPane;
