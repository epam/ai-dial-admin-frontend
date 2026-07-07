'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialLoader } from '@epam/ai-dial-ui-kit';

import { getTestCaseRunResultDetails } from '@/src/app/[lang]/runs/actions';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { MetricBindings } from '@/src/models/evaluation/metric';
import { AnalyticsResult } from '@/src/models/evaluation/run';
import { Resizable } from 're-resizable';

import ComparisonPivotView from './ComparisonPivotView';
import ComparisonTableView from './ComparisonTableView';
import DrawerToolbar from './DrawerToolbar';
import FieldSelector from './FieldSelector';
import ResizeHandle from './ResizeHandle';
import { COLLAPSED_HEIGHT, MIN_DRAWER_HEIGHT, MAX_DRAWER_OFFSET } from './constants';
import { ViewMode } from './models';
import { useDrawerPanel } from './useDrawerPanel';
import { useFieldSelector } from './useFieldSelector';
import { buildComparisonSections, countDiffs } from './utils';

interface Props {
  drawerPanel: ReturnType<typeof useDrawerPanel>;
  pendingFocus: boolean;
  clearPendingFocus: () => void;
  onClose: () => void;
  onSwitchToSidebar: () => void;
  metricBindings?: Record<string, MetricBindings>;
}

const AnalyticsBottomDrawer: FC<Props> = ({
  drawerPanel,
  pendingFocus,
  clearPendingFocus,
  onClose,
  onSwitchToSidebar,
  metricBindings,
}) => {
  const t = useI18n();
  const [activeDetail, setActiveDetail] = useState<AnalyticsResult | null>(null);
  const [pinnedDetail, setPinnedDetail] = useState<AnalyticsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pinnedCacheRef = useRef<AnalyticsResult | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Fetch active detail
  useEffect(() => {
    if (!drawerPanel.activeId) return;
    setIsLoading(true);
    setError(null);
    getTestCaseRunResultDetails(drawerPanel.activeId).then((res) => {
      if (res) {
        setActiveDetail(res);
      } else {
        setError(t(RunsI18nKey.LoadError));
        setActiveDetail(null);
      }
      setIsLoading(false);
    });
  }, [drawerPanel.activeId, t]);

  // Fetch pinned detail
  useEffect(() => {
    if (!drawerPanel.pinnedId) {
      pinnedCacheRef.current = null;
      setPinnedDetail(null);
      return;
    }
    if (pinnedCacheRef.current?.id === drawerPanel.pinnedId) {
      setPinnedDetail(pinnedCacheRef.current);
      return;
    }
    getTestCaseRunResultDetails(drawerPanel.pinnedId).then((res) => {
      if (res) {
        pinnedCacheRef.current = res;
        setPinnedDetail(res);
      } else {
        pinnedCacheRef.current = null;
        setPinnedDetail(null);
      }
    });
  }, [drawerPanel.pinnedId]);

  // Build comparison sections
  const sections = useMemo(() => {
    if (!activeDetail) return [];
    return buildComparisonSections(activeDetail, pinnedDetail, {}, [], {}, metricBindings);
  }, [activeDetail, pinnedDetail, metricBindings]);

  const fieldSelector = useFieldSelector(sections);

  // Memoized filtered sections with field visibility applied
  const visibleSections = useMemo(() => {
    if (!activeDetail) return [];
    return buildComparisonSections(
      activeDetail,
      pinnedDetail,
      fieldSelector.fieldVisibility,
      fieldSelector.sectionOrder,
      fieldSelector.sectionHidden,
      metricBindings,
    );
  }, [
    activeDetail,
    pinnedDetail,
    fieldSelector.fieldVisibility,
    fieldSelector.sectionOrder,
    fieldSelector.sectionHidden,
    metricBindings,
  ]);

  // Init section order when sections change
  useEffect(() => {
    if (sections.length > 0) {
      fieldSelector.initOrder(sections.map((s) => s.key));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections.length]);

  const diffCount = useMemo(() => countDiffs(visibleSections), [visibleSections]);

  // Focus management for switchToDrawer
  useEffect(() => {
    if (pendingFocus && toolbarRef.current) {
      const firstFocusable = toolbarRef.current.querySelector<HTMLElement>('button, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) {
        requestAnimationFrame(() => {
          firstFocusable.focus();
          clearPendingFocus();
        });
      } else {
        clearPendingFocus();
      }
    }
  }, [pendingFocus, clearPendingFocus]);

  // Escape key handler
  useEffect(() => {
    const onEscapeKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (event.defaultPrevented) return;
      if (drawerRef.current && !drawerRef.current.contains(document.activeElement)) return;
      onClose();
    };
    window.addEventListener('keydown', onEscapeKeyDown);
    return () => window.removeEventListener('keydown', onEscapeKeyDown);
  }, [onClose]);

  // Reset local selector state on unmount; drawer lifecycle (open/close) is
  // managed by the parent via useLayoutEffect so we must NOT call drawerPanel.close()
  // here — doing so races with the parent's drawerPanel.open() when switching modes.
  useEffect(() => {
    return () => {
      fieldSelector.resetAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPinActive = useCallback(() => {
    if (drawerPanel.activeId) {
      drawerPanel.pin(drawerPanel.activeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerPanel.activeId, drawerPanel.pin]);

  const onSwitchSidebar = useCallback(() => {
    fieldSelector.resetAll();
    onSwitchToSidebar();
  }, [fieldSelector, onSwitchToSidebar]);

  const onCloseDrawer = useCallback(() => {
    fieldSelector.resetAll();
    onClose();
  }, [fieldSelector, onClose]);

  const maxHeight = typeof window !== 'undefined' ? window.innerHeight - MAX_DRAWER_OFFSET : MIN_DRAWER_HEIGHT;

  const panelHeight = drawerPanel.isCollapsed ? COLLAPSED_HEIGHT : drawerPanel.panelHeight;

  return createPortal(
    <Resizable
      size={{ width: '100%', height: panelHeight }}
      minHeight={drawerPanel.isCollapsed ? COLLAPSED_HEIGHT : MIN_DRAWER_HEIGHT}
      maxHeight={maxHeight}
      enable={{ top: !drawerPanel.isCollapsed }}
      handleComponent={{ top: <ResizeHandle /> }}
      handleStyles={{ top: { height: '10px', top: 0 } }}
      onResizeStop={(_e, _dir, _ref, delta) => {
        drawerPanel.setPanelHeight(drawerPanel.panelHeight + delta.height);
      }}
      className="fixed !bottom-0 !inset-x-0 z-[35] bg-layer-1 border-t border-primary flex flex-col"
      style={{ position: 'fixed', bottom: 0, left: 0, right: 0, top: 'auto' }}
    >
      <div
        ref={drawerRef}
        className="flex flex-col size-full"
        role="complementary"
        aria-label={t(RunsI18nKey.AnalysisDrawerLabel)}
      >
        <div ref={toolbarRef}>
          <DrawerToolbar
            viewMode={drawerPanel.viewMode}
            onSetView={drawerPanel.setView}
            activeId={drawerPanel.activeId}
            activeName={activeDetail?.testCaseName ?? null}
            pinnedId={drawerPanel.pinnedId}
            pinnedName={pinnedDetail?.testCaseName ?? null}
            onPin={onPinActive}
            onUnpin={drawerPanel.unpin}
            diffCount={diffCount}
            isCollapsed={drawerPanel.isCollapsed}
            onCollapse={drawerPanel.collapse}
            onExpand={drawerPanel.expand}
            onClose={onCloseDrawer}
            onSwitchToSidebar={onSwitchSidebar}
          />
        </div>
        {!drawerPanel.isCollapsed && (
          <div className="flex flex-1 min-h-0 overflow-hidden">
            <FieldSelector sections={sections} fieldSelector={fieldSelector} />
            <div className="flex-1 overflow-auto min-h-0">
              {isLoading || (!activeDetail && !error) ? (
                <div className="flex items-center justify-center h-full">
                  <DialLoader size={32} />
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full text-error dial-small-text">{error}</div>
              ) : fieldSelector.allFieldsHidden ? (
                <div className="flex items-center justify-center h-full text-secondary dial-small-text">
                  {t(RunsI18nKey.NoFieldsVisible)}
                </div>
              ) : drawerPanel.viewMode === ViewMode.Table ? (
                <ComparisonTableView
                  key="table"
                  sections={visibleSections}
                  activeDetail={activeDetail}
                  pinnedDetail={pinnedDetail}
                  spotlightedFields={fieldSelector.spotlightedFields}
                  onToggleSpotlight={fieldSelector.toggleSpotlight}
                />
              ) : (
                <ComparisonPivotView
                  key="pivot"
                  sections={visibleSections}
                  activeDetail={activeDetail}
                  pinnedDetail={pinnedDetail}
                  spotlightedFields={fieldSelector.spotlightedFields}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </Resizable>,
    document.body,
  );
};

export default AnalyticsBottomDrawer;
