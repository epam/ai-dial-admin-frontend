'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { COLLAPSED_HEIGHT, DEFAULT_DRAWER_HEIGHT, MAX_DRAWER_OFFSET } from './constants';
import { DrawerPanelState, ViewMode } from './models';

interface UseDrawerPanelReturn extends DrawerPanelState {
  open: (id: string) => void;
  close: () => void;
  collapse: () => void;
  expand: () => void;
  pin: (id: string) => void;
  unpin: () => void;
  setView: (mode: ViewMode) => void;
  setActiveId: (id: string) => void;
  setPanelHeight: (height: number) => void;
  clearPinIfMissing: (resultIds: string[]) => void;
  openRunCompare: (activeId: string, comparedId: string | null) => void;
}

export function useDrawerPanel(): UseDrawerPanelReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [panelHeight, setPanelHeight] = useState(DEFAULT_DRAWER_HEIGHT);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Table);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [isRunCompareMode, setIsRunCompareMode] = useState(false);

  const currentHeight = useMemo(() => {
    if (!isOpen) return 0;
    return isCollapsed ? COLLAPSED_HEIGHT : panelHeight;
  }, [isOpen, isCollapsed, panelHeight]);

  const open = useCallback((id: string) => {
    setActiveId(id);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setActiveId(null);
    setPinnedId(null);
    setIsCollapsed(false);
    setIsRunCompareMode(false);
  }, []);

  const collapse = useCallback(() => {
    setIsCollapsed(true);
  }, []);

  const expand = useCallback(() => {
    setIsCollapsed(false);
  }, []);

  const pin = useCallback((id: string) => {
    setPinnedId(id);
  }, []);

  const unpin = useCallback(() => {
    setPinnedId(null);
  }, []);

  const setView = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  const clearPinIfMissing = useCallback(
    (resultIds: string[]) => {
      if (isRunCompareMode) return;
      setPinnedId((prev) => {
        if (prev === null) return null;
        if (!resultIds.includes(prev)) return null;
        return prev;
      });
    },
    [isRunCompareMode],
  );

  const openRunCompare = useCallback((newActiveId: string, comparedId: string | null) => {
    setActiveId(newActiveId);
    setPinnedId(comparedId);
    setIsRunCompareMode(true);
    setIsOpen(true);
  }, []);

  // Window resize listener to clamp panel height
  useEffect(() => {
    const handleResize = () => {
      const maxHeight = window.innerHeight - MAX_DRAWER_OFFSET;
      setPanelHeight((prev) => Math.min(prev, maxHeight));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isOpen,
    panelHeight,
    isCollapsed,
    viewMode,
    activeId,
    pinnedId,
    currentHeight,
    isRunCompareMode,
    open,
    close,
    collapse,
    expand,
    pin,
    unpin,
    setView,
    setActiveId,
    setPanelHeight,
    clearPinIfMissing,
    openRunCompare,
  };
}
