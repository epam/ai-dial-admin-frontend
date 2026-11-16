'use client';

import { UIEvent, useCallback, useLayoutEffect, useRef } from 'react';

import { useSourcePanel } from '@/src/components/Analytics/QueryBuilder/SourcePanel/context';
import { SourcePanelTab } from '@/src/components/Analytics/QueryBuilder/SourcePanel/models';

export const usePreservedScroll = (tab: SourcePanelTab) => {
  const { scrollPositions } = useSourcePanel();
  const ref = useRef<HTMLUListElement>(null);

  useLayoutEffect(() => {
    if (ref.current) ref.current.scrollTop = scrollPositions.current[tab] ?? 0;
  }, [scrollPositions, tab]);

  const onScroll = useCallback(
    (event: UIEvent<HTMLUListElement>) => {
      scrollPositions.current[tab] = event.currentTarget.scrollTop;
    },
    [scrollPositions, tab],
  );

  return { ref, onScroll };
};
