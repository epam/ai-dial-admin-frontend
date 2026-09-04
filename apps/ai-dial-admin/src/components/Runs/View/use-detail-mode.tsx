'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { SidebarPosition } from '@/src/components/Common/Sidebar/models';
import { ROW_DETAIL_BOTTOM_CLASS } from '@/src/components/Runs/Details/RowDetails/constants';
import RunMetricDetailPanel from '@/src/components/Runs/Details/RunMetricDetailPanel';
import { DetailMode } from '@/src/components/Runs/Details/BottomDrawer/models';
import ExecutionRowDetailBottomPanel from '@/src/components/Runs/View/RowDetails/ExecutionRowDetailBottomPanel';
import { useAppContext } from '@/src/context/AppContext';
import { MetricBindings } from '@/src/models/evaluation/metric';

export interface OpenDetailOptions {
  /** Present when the open was triggered by a grid cell click (never toggles closed). */
  focusFieldKey?: string | null;
}

interface UseDetailModeReturn {
  detailMode: DetailMode;
  selectedResultId: string | null;
  focusFieldKey: string | null;
  openDetail: (resultId: string, options?: OpenDetailOptions) => void;
  closeDetail: () => void;
  switchToDrawer: () => void;
  switchToSidebar: () => void;
  clearSelected: () => void;
}

export function useDetailMode(metricBindings: Record<string, MetricBindings> = {}): UseDetailModeReturn {
  const { sidebar } = useAppContext();
  const [detailMode, setDetailMode] = useState<DetailMode>(DetailMode.Drawer);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [focusFieldKey, setFocusFieldKey] = useState<string | null>(null);

  const sidebarRef = useRef(sidebar);
  sidebarRef.current = sidebar;

  const selectedResultIdRef = useRef(selectedResultId);
  selectedResultIdRef.current = selectedResultId;

  const detailModeRef = useRef(detailMode);
  detailModeRef.current = detailMode;

  const showDetailPanelRef = useRef<(resultId: string, mode: DetailMode, fieldKey: string | null) => void>(() => {});

  const closeDetail = useCallback(() => {
    setSelectedResultId(null);
    setFocusFieldKey(null);
    sidebarRef.current.closeSidebar();
  }, []);

  const switchToDrawer = useCallback(() => {
    setDetailMode(DetailMode.Drawer);
    const currentId = selectedResultIdRef.current;
    if (currentId) {
      showDetailPanelRef.current(currentId, DetailMode.Drawer, null);
    }
  }, []);

  const switchToSidebar = useCallback(() => {
    setDetailMode(DetailMode.Sidebar);
    const currentId = selectedResultIdRef.current;
    if (currentId) {
      showDetailPanelRef.current(currentId, DetailMode.Sidebar, null);
    }
  }, []);

  const showDetailPanel = useCallback(
    (resultId: string, mode: DetailMode, fieldKey: string | null) => {
      if (mode === DetailMode.Drawer) {
        sidebarRef.current.showSidebar(
          <ExecutionRowDetailBottomPanel
            resultId={resultId}
            focusFieldKey={fieldKey}
            onClose={closeDetail}
            onSwitchToSidebar={switchToSidebar}
          />,
          ROW_DETAIL_BOTTOM_CLASS,
          SidebarPosition.Bottom,
        );
        return;
      }

      sidebarRef.current.showSidebar(
        <RunMetricDetailPanel
          resultId={resultId}
          onClose={closeDetail}
          onSwitchMode={switchToDrawer}
          metricBindings={metricBindings}
        />,
        'w-[750px]',
        SidebarPosition.Right,
      );
    },
    [closeDetail, switchToSidebar, switchToDrawer, metricBindings],
  );

  showDetailPanelRef.current = showDetailPanel;

  const openDetail = useCallback(
    (resultId: string, options?: OpenDetailOptions) => {
      const isCellClick = options != null;
      const fieldKey = options?.focusFieldKey ?? null;
      const isSameRow = selectedResultIdRef.current === resultId;
      const isOpen = selectedResultIdRef.current != null;

      // Row re-click toggles closed; cell click on the same row never toggles.
      if (isSameRow && isOpen && !isCellClick) {
        closeDetail();
        return;
      }

      setSelectedResultId(resultId);
      setFocusFieldKey(fieldKey);
      showDetailPanel(resultId, detailModeRef.current, fieldKey);
    },
    [closeDetail, showDetailPanel],
  );

  const clearSelected = useCallback(() => {
    setSelectedResultId(null);
    setFocusFieldKey(null);
  }, []);

  useEffect(() => {
    return () => {
      sidebarRef.current.closeSidebar();
    };
  }, []);

  return {
    detailMode,
    selectedResultId,
    focusFieldKey,
    openDetail,
    closeDetail,
    switchToDrawer,
    switchToSidebar,
    clearSelected,
  };
}
