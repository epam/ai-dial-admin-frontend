'use client';

import { useState } from 'react';

import { GRID_COLUMNS_KEY } from '@/src/components/Grid/constants';
import { SESSIONS_STORAGE_KEY, SESSIONS_STORAGE_TABLE_KEY } from '@/src/constants/analytics/sessions-trace';
import { DEFAULT_SESSIONS_SOURCE_SETTING } from '@/src/constants/analytics/sessions-source';
import { getFromLocalStorage, setToLocalStorage } from '@/src/utils/local-storage';

const discardStaleState = (baseTable: string): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const savedFor = getFromLocalStorage(SESSIONS_STORAGE_TABLE_KEY) || DEFAULT_SESSIONS_SOURCE_SETTING.baseTable;

  if (savedFor !== baseTable) {
    localStorage.removeItem(`${GRID_COLUMNS_KEY}${SESSIONS_STORAGE_KEY}`);
  }
  setToLocalStorage(SESSIONS_STORAGE_TABLE_KEY, baseTable);
};

export const useSessionGridStorage = (baseTable: string): string => {
  useState(() => discardStaleState(baseTable));

  return SESSIONS_STORAGE_KEY;
};
