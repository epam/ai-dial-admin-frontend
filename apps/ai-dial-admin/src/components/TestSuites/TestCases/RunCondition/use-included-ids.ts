'use client';

import { useEffect, useRef, useState } from 'react';

import { executeStructuredQuery } from '@/src/app/[lang]/runs/actions';
import { FilterNode } from '@/src/models/evaluation/structured-query';

import { PREVIEW_DEBOUNCE_MS } from './constants';
import { buildIncludedIdsQuery, parseIncludedIds } from './utils';

export const useIncludedIds = (
  datasetId: string | undefined,
  testCaseFilter: FilterNode | null | undefined,
): Set<string> | null => {
  const [includedIds, setIncludedIds] = useState<Set<string> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!datasetId || !testCaseFilter) {
      setIncludedIds((prev) => (prev == null ? prev : null));
      return;
    }

    setIncludedIds((prev) => (prev == null ? prev : null));
    const requestId = ++requestIdRef.current;
    const timer = window.setTimeout(() => {
      executeStructuredQuery(buildIncludedIdsQuery(datasetId, testCaseFilter)).then((result) => {
        if (requestId !== requestIdRef.current) {
          return;
        }
        if (result == null) {
          setIncludedIds(null);
          return;
        }
        setIncludedIds(parseIncludedIds(result.rows));
      });
    }, PREVIEW_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [datasetId, testCaseFilter]);

  return includedIds;
};
