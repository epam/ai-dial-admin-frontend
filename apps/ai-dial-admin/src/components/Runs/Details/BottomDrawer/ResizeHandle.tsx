import { FC, type MouseEvent, type KeyboardEvent, useCallback } from 'react';

import { MIN_DRAWER_HEIGHT, MAX_DRAWER_OFFSET, RESIZE_STEP, RESIZE_STEP_LARGE } from './types';
import { useDrawerPanel } from './useDrawerPanel';

interface Props {
  onDragStart: (e: MouseEvent) => void;
  drawerPanel: ReturnType<typeof useDrawerPanel>;
}

const ResizeHandle: FC<Props> = ({ onDragStart, drawerPanel }) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      let delta = 0;
      if (e.key === 'ArrowUp') {
        delta = e.shiftKey ? RESIZE_STEP_LARGE : RESIZE_STEP;
      } else if (e.key === 'ArrowDown') {
        delta = -(e.shiftKey ? RESIZE_STEP_LARGE : RESIZE_STEP);
      }
      if (delta === 0) return;

      e.preventDefault();
      const maxHeight = window.innerHeight - MAX_DRAWER_OFFSET;
      const newHeight = Math.max(MIN_DRAWER_HEIGHT, Math.min(maxHeight, drawerPanel.panelHeight + delta));
      drawerPanel.setPanelHeight(newHeight);
    },
    [drawerPanel],
  );

  return (
    <div
      className="h-1.5 cursor-ns-resize flex items-center justify-center hover:bg-layer-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-primary"
      tabIndex={0}
      role="separator"
      aria-orientation="horizontal"
      aria-label="Resize drawer"
      onMouseDown={onDragStart}
      onKeyDown={handleKeyDown}
    >
      <div className="w-8 flex flex-col gap-px items-center">
        <div className="w-full h-px bg-secondary" />
        <div className="w-full h-px bg-secondary" />
        <div className="w-full h-px bg-secondary" />
      </div>
    </div>
  );
};

export default ResizeHandle;
