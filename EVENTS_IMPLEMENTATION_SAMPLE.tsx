// Sample implementation for Events component with incremental updates and scroll preservation

import { FC, MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GridApi } from 'ag-grid-community';
import { IconColumns2 } from '@tabler/icons-react';
import { DialGhostButton } from '@epam/ai-dial-ui-kit';
import { ApplicationRoute } from '@/src/types/routes';
import { KubEvent } from '@/src/models/deployments/containers';
import { useI18n } from '@/src/locales/client';
import ListView from '@/src/components/ListView/ListView';
import { ButtonsI18nKey, EntitiesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import ResetFiltersButton from '@/src/components/EntityListView/HeaderButtons/ResetFiltersButton';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { CONTAINER_EVENTS } from '@/src/constants/grid-columns/grid-columns';
import { ROW_HEIGHT } from '@/src/components/Grid/constants';

interface Props {
  route: ApplicationRoute;
  events: KubEvent[];
}

const Events: FC<Props> = ({ route, events }) => {
  const t = useI18n();

  const [showColumnsPanel, setShowColumnsPanel] = useState(false);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  // Track previous events to detect new ones
  const previousEventsRef = useRef<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // Sort events (newest first)
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => b.firstTimestamp - a.firstTimestamp);
  }, [events]);

  const onGridReady = useCallback((api: GridApi) => {
    setGridApi(api);
  }, []);

  // Function to get scroll container element
  const getScrollContainer = (): HTMLElement | null => {
    if (!containerRef.current) return null;
    return containerRef.current.querySelector('.ag-body-viewport') as HTMLElement;
  };

  // Function to preserve scroll position when new items are added
  const preserveScrollPosition = useCallback((newItemsCount: number) => {
    const scrollContainer = getScrollContainer();
    if (!scrollContainer) return;

    const scrollTop = scrollContainer.scrollTop;
    const scrollHeight = scrollContainer.scrollHeight;
    const clientHeight = scrollContainer.clientHeight;

    // Threshold for "at top" or "at bottom" (5px tolerance)
    const THRESHOLD = 5;
    const isAtTop = scrollTop <= THRESHOLD;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - THRESHOLD;

    // Calculate scroll shift: new items added at top
    const scrollShift = newItemsCount * ROW_HEIGHT;

    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      if (isAtTop) {
        // Keep at top - new items appear above, stay at top
        scrollContainer.scrollTop = 0;
      } else if (isAtBottom) {
        // Keep at bottom - scroll to new bottom
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      } else {
        // Adjust scroll position by shift amount
        // New items are added at top, so we shift down
        scrollContainer.scrollTop = scrollTop + scrollShift;
      }
    });
  }, []);

  // Detect and add new events incrementally
  useEffect(() => {
    if (!gridApi || sortedEvents.length === 0) {
      // Initialize previous events set
      if (sortedEvents.length > 0) {
        previousEventsRef.current = new Set(sortedEvents.map((e) => e.id));
      }
      return;
    }

    // Find new events (not in previous set)
    const currentEventIds = new Set(sortedEvents.map((e) => e.id));
    const newEvents = sortedEvents.filter((e) => !previousEventsRef.current.has(e.id));

    if (newEvents.length === 0) {
      // No new events, just update the ref
      previousEventsRef.current = currentEventIds;
      return;
    }

    // Get current scroll position before update
    const scrollContainer = getScrollContainer();
    const scrollTopBefore = scrollContainer?.scrollTop ?? 0;
    const scrollHeightBefore = scrollContainer?.scrollHeight ?? 0;
    const clientHeight = scrollContainer?.clientHeight ?? 0;
    const isAtTop = scrollTopBefore <= 5;
    const isAtBottom = scrollTopBefore + clientHeight >= scrollHeightBefore - 5;

    // Add new events using transaction (only new rows, no full re-render)
    // New events are added at index 0 (top) since we sort newest first
    gridApi.applyTransaction({
      add: newEvents,
      addIndex: 0,
    });

    // Update previous events set
    previousEventsRef.current = currentEventIds;

    // Preserve scroll position after DOM update
    if (scrollContainer) {
      // Use setTimeout to ensure transaction is applied
      setTimeout(() => {
        const scrollShift = newEvents.length * ROW_HEIGHT;
        const scrollTopAfter = scrollContainer.scrollTop;
        const scrollHeightAfter = scrollContainer.scrollHeight;

        if (isAtTop) {
          // Keep at top
          scrollContainer.scrollTop = 0;
        } else if (isAtBottom) {
          // Keep at bottom - scroll to new bottom
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        } else {
          // Adjust scroll: new items added at top, so shift down
          scrollContainer.scrollTop = scrollTopBefore + scrollShift;
        }
      }, 0);
    }
  }, [gridApi, sortedEvents, preserveScrollPosition]);

  const toggleColumnsPanel = useCallback(() => setShowColumnsPanel(!showColumnsPanel), [showColumnsPanel]);
  const closeColumnsPanel = useCallback(() => setShowColumnsPanel(false), [setShowColumnsPanel]);

  useEffect(() => {
    window.addEventListener('click', closeColumnsPanel);
    return () => window.removeEventListener('click', closeColumnsPanel);
  }, [closeColumnsPanel]);

  const onToggleColumnsPanel = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      toggleColumnsPanel();
    },
    [toggleColumnsPanel],
  );

  return (
    <div ref={containerRef} className="flex h-full">
      <ListView
        view={route}
        data={sortedEvents}
        columnDefs={CONTAINER_EVENTS(t)}
        title={t(TabsI18nKey.Events)}
        emptyDataTitle={t(EntitiesI18nKey.NoEvents)}
        showColumnsPanel={showColumnsPanel}
        toggleColumnsPanel={toggleColumnsPanel}
        onGridReady={onGridReady}
        storageKey={`${route}/events`}
      >
        <div className="flex gap-4">
          {!!sortedEvents.length && (
            <>
              <ResetFiltersButton gridApi={gridApi} />
              <DialGhostButton
                label={t(ButtonsI18nKey.Columns)}
                iconBefore={<IconColumns2 {...BASE_BUTTON_ICON_PROPS} />}
                onClick={onToggleColumnsPanel}
              />
            </>
          )}
        </div>
      </ListView>
    </div>
  );
};

export default Events;
