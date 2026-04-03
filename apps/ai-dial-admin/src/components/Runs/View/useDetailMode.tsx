'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import RunMetricDetailPanel from '@/src/components/Runs/Details/RunMetricDetailPanel';
import { useAppContext } from '@/src/context/AppContext';

import { DetailMode } from '../Details/BottomDrawer/models';

interface UseDetailModeReturn {
  detailMode: DetailMode;
  selectedResultId: string | null;
  drawerOpen: boolean;
  pendingFocus: boolean;
  clearPendingFocus: () => void;
  openDetail: (resultId: string) => void;
  closeDetail: () => void;
  switchToDrawer: () => void;
  switchToSidebar: () => void;
}

export function useDetailMode(): UseDetailModeReturn {
  const { sidebar } = useAppContext();
  const [detailMode, setDetailMode] = useState<DetailMode>('sidebar');
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingFocus, setPendingFocus] = useState(false);
  const sidebarRef = useRef(sidebar);
  sidebarRef.current = sidebar;

  const clearPendingFocus = useCallback(() => {
    setPendingFocus(false);
  }, []);

  const showSidebarPanel = useCallback(
    (resultId: string, onSwitchMode: () => void) => {
      sidebar.showSidebar(
        <RunMetricDetailPanel
          resultId={resultId}
          onClose={() => {
            setSelectedResultId(null);
            sidebar.closeSidebar();
          }}
          onSwitchMode={onSwitchMode}
        />,
        'w-[750px]',
      );
    },
    [sidebar],
  );

  const switchToDrawer = useCallback(() => {
    sidebarRef.current.closeSidebar();
    setDetailMode('drawer');
    setDrawerOpen(true);
    setPendingFocus(true);
  }, []);

  const switchToSidebar = useCallback(() => {
    setDetailMode('sidebar');
    setDrawerOpen(false);
    const currentId = selectedResultId;
    if (currentId) {
      // Use setTimeout to let drawer cleanup happen first
      setTimeout(() => {
        showSidebarPanel(currentId, () => {
          switchToDrawer();
        });
      }, 0);
    }
  }, [selectedResultId, showSidebarPanel, switchToDrawer]);

  const openDetail = useCallback(
    (resultId: string) => {
      if (detailMode === 'sidebar') {
        if (selectedResultId === resultId) {
          // Toggle close
          setSelectedResultId(null);
          sidebar.closeSidebar();
          return;
        }
        setSelectedResultId(resultId);
        showSidebarPanel(resultId, switchToDrawer);
      } else {
        if (selectedResultId === resultId && drawerOpen) {
          // Toggle close
          setSelectedResultId(null);
          setDrawerOpen(false);
          return;
        }
        setSelectedResultId(resultId);
        setDrawerOpen(true);
      }
    },
    [detailMode, selectedResultId, drawerOpen, sidebar, showSidebarPanel, switchToDrawer],
  );

  const closeDetail = useCallback(() => {
    setSelectedResultId(null);
    if (detailMode === 'sidebar') {
      sidebar.closeSidebar();
    } else {
      setDrawerOpen(false);
    }
  }, [detailMode, sidebar]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sidebarRef.current.closeSidebar();
      setDrawerOpen(false);
    };
  }, []);

  return {
    detailMode,
    selectedResultId,
    drawerOpen,
    pendingFocus,
    clearPendingFocus,
    openDetail,
    closeDetail,
    switchToDrawer,
    switchToSidebar,
  };
}
