'use client';

import { useMemo, useState } from 'react';

import { Resizable } from 're-resizable';

import { useAppContext } from '@/src/context/AppContext';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { mergeClasses } from '@/src/utils/merge-classes';

import { COLLAPSED_DOCK_HEIGHT, DEFAULT_DOCK_HEIGHT, MAX_DOCK_OFFSET, MIN_DOCK_HEIGHT } from './constants';
import { DockPosition } from './models';

const Sidebar = () => {
  const t = useI18n();
  const { sidebar } = useAppContext();
  const { show, content, className, dockable, dockPosition, dockCollapsed } = sidebar;

  const [dockHeight, setDockHeight] = useState(DEFAULT_DOCK_HEIGHT);

  const maxDockHeight = useMemo(
    () => (typeof window !== 'undefined' ? window.innerHeight - MAX_DOCK_OFFSET : DEFAULT_DOCK_HEIGHT),
    [],
  );

  if (!show || !content) return null;

  const isBottom = dockable && dockPosition === DockPosition.Bottom;

  if (isBottom) {
    const height = dockCollapsed ? COLLAPSED_DOCK_HEIGHT : dockHeight;
    return (
      <SaveValidationContextProvider>
        {/* Absolute (not fixed) so the overlay stays within the main content area and does not cover the left menu. */}
        <Resizable
          size={{ width: '100%', height }}
          minHeight={dockCollapsed ? COLLAPSED_DOCK_HEIGHT : MIN_DOCK_HEIGHT}
          maxHeight={maxDockHeight}
          enable={{ top: !dockCollapsed }}
          handleComponent={
            dockCollapsed ? undefined : { top: <DockResizeHandle label={t(BasicI18nKey.ResizePanel)} /> }
          }
          handleStyles={{ top: { height: '10px', top: 0 } }}
          onResizeStop={(_e, _dir, _ref, delta) => setDockHeight((prev) => prev + delta.height)}
          className="absolute !bottom-0 !inset-x-0 z-[35] flex flex-col border-t border-primary bg-layer-0"
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, top: 'auto' }}
        >
          <div className="flex size-full flex-col overflow-hidden p-4">{content}</div>
        </Resizable>
      </SaveValidationContextProvider>
    );
  }

  return (
    <SaveValidationContextProvider>
      <aside
        className={mergeClasses('flex shrink-0 min-w-[400px] h-full overflow-hidden bg-layer-0 p-4 z-10', className)}
      >
        {content}
      </aside>
    </SaveValidationContextProvider>
  );
};

export default Sidebar;

interface DockResizeHandleProps {
  label: string;
}

const DockResizeHandle = ({ label }: DockResizeHandleProps) => {
  return (
    <div
      className="flex h-2.5 cursor-ns-resize items-center justify-center transition-colors hover:bg-layer-2"
      role="separator"
      aria-orientation="horizontal"
      aria-label={label}
    >
      <div className="h-1 w-10 rounded-full bg-tertiary" />
    </div>
  );
};
