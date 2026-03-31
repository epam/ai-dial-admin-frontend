'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialLoader } from '@epam/ai-dial-ui-kit';

import { getTestCaseRunResultDetails } from '@/src/app/[lang]/runs/actions';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AnalyticsResult } from '@/src/models/evaluation/run';

import ComparisonPivotView from './ComparisonPivotView';
import ComparisonTableView from './ComparisonTableView';
import DrawerToolbar from './DrawerToolbar';
import FieldSelector from './FieldSelector';
import ResizeHandle from './ResizeHandle';
import { COLLAPSED_HEIGHT, MIN_DRAWER_HEIGHT, MAX_DRAWER_OFFSET } from './types';
import { useDrawerPanel } from './useDrawerPanel';
import { useFieldSelector } from './useFieldSelector';
import { buildComparisonSections, countDiffs } from './utils';

interface Props {
  drawerPanel: ReturnType<typeof useDrawerPanel>;
  pendingFocus: boolean;
  clearPendingFocus: () => void;
  onClose: () => void;
  onSwitchToSidebar: () => void;
}

const AnalyticsBottomDrawer: FC<Props> = ({
  drawerPanel,
  pendingFocus,
  clearPendingFocus,
  onClose,
  onSwitchToSidebar,
}) => {
  const t = useI18n();
  const [activeDetail, setActiveDetail] = useState<AnalyticsResult | null>(null);
  const [pinnedDetail, setPinnedDetail] = useState<AnalyticsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pinnedCacheRef = useRef<AnalyticsResult | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

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
    return buildComparisonSections(activeDetail, pinnedDetail, {}, [], {});
  }, [activeDetail, pinnedDetail]);

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
    );
  }, [
    activeDetail,
    pinnedDetail,
    fieldSelector.fieldVisibility,
    fieldSelector.sectionOrder,
    fieldSelector.sectionHidden,
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
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (event.defaultPrevented) return;
      if (drawerRef.current && !drawerRef.current.contains(document.activeElement)) return;
      onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Resize drag handlers
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      const startY = e.clientY;
      const startHeight = drawerPanel.panelHeight;

      const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
        const delta = startY - moveEvent.clientY;
        const newHeight = Math.max(
          MIN_DRAWER_HEIGHT,
          Math.min(window.innerHeight - MAX_DRAWER_OFFSET, startHeight + delta),
        );
        drawerPanel.setPanelHeight(newHeight);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [drawerPanel.panelHeight, drawerPanel.setPanelHeight],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      drawerPanel.close();
      fieldSelector.resetAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePin = useCallback(() => {
    if (drawerPanel.activeId) {
      drawerPanel.pin(drawerPanel.activeId);
    }
  }, [drawerPanel.activeId, drawerPanel.pin]);

  const handleSwitchToSidebar = useCallback(() => {
    fieldSelector.resetAll();
    onSwitchToSidebar();
  }, [fieldSelector, onSwitchToSidebar]);

  const handleClose = useCallback(() => {
    fieldSelector.resetAll();
    onClose();
  }, [fieldSelector, onClose]);

  const panelStyle = useMemo(
    () => ({
      height: drawerPanel.isCollapsed ? COLLAPSED_HEIGHT : drawerPanel.panelHeight,
      transition: isDragging ? 'none' : 'height 150ms ease',
    }),
    [drawerPanel.isCollapsed, drawerPanel.panelHeight, isDragging],
  );

  return createPortal(
    <div
      ref={drawerRef}
      className="fixed bottom-0 inset-x-0 z-[35] bg-layer-1 border-t border-primary flex flex-col"
      style={panelStyle}
      role="complementary"
      aria-label="Analysis drawer"
    >
      {!drawerPanel.isCollapsed && <ResizeHandle onDragStart={handleDragStart} drawerPanel={drawerPanel} />}
      <div ref={toolbarRef}>
        <DrawerToolbar
          viewMode={drawerPanel.viewMode}
          onSetView={drawerPanel.setView}
          activeId={drawerPanel.activeId}
          activeName={activeDetail?.testCaseName ?? null}
          pinnedId={drawerPanel.pinnedId}
          pinnedName={pinnedDetail?.testCaseName ?? null}
          onPin={handlePin}
          onUnpin={drawerPanel.unpin}
          diffCount={diffCount}
          isCollapsed={drawerPanel.isCollapsed}
          onCollapse={drawerPanel.collapse}
          onExpand={drawerPanel.expand}
          onClose={handleClose}
          onSwitchToSidebar={handleSwitchToSidebar}
        />
      </div>
      {!drawerPanel.isCollapsed && (
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <FieldSelector sections={sections} fieldSelector={fieldSelector} />
          <div className="flex-1 overflow-auto min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <DialLoader size={32} />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full text-error text-sm">{error}</div>
            ) : fieldSelector.allFieldsHidden ? (
              <div className="flex items-center justify-center h-full text-secondary text-sm">
                {t(RunsI18nKey.NoFieldsVisible)}
              </div>
            ) : drawerPanel.viewMode === 'table' ? (
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
    </div>,
    document.body,
  );
};

export default AnalyticsBottomDrawer;
