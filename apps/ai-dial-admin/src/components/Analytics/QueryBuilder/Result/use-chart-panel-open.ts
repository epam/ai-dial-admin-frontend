'use client';

import { useCallback, useEffect, useState } from 'react';

import { getFromLocalStorage, setToLocalStorage } from '@/src/utils/local-storage';

const CHART_PANEL_STORAGE_KEY = 'query-builder-chart-panel-open';

export const useChartPanelOpen = (): [boolean, (isOpen: boolean) => void] => {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    setIsOpen(getFromLocalStorage(CHART_PANEL_STORAGE_KEY) !== 'false');
  }, []);

  const onToggle = useCallback((next: boolean) => {
    setIsOpen(next);
    setToLocalStorage(CHART_PANEL_STORAGE_KEY, String(next));
  }, []);

  return [isOpen, onToggle];
};
