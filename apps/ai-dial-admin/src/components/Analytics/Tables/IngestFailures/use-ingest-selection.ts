'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { IngestFailureGroup } from '@/src/components/Analytics/Tables/IngestFailures/models';
import { failureKey, toRetryTarget } from '@/src/components/Analytics/Tables/IngestFailures/utils';
import { IngestFailure, IngestFailureTarget } from '@/src/models/analytics/ingest-failure';

export interface IngestSelection {
  keys: Set<string>;
  targets: IngestFailureTarget[];
  toggle: (failure: IngestFailure, isSelected: boolean) => void;
  selectGroup: (group: IngestFailureGroup, isSelected: boolean) => void;
  clear: () => void;
}

export const useIngestSelection = (listed: IngestFailure[]): IngestSelection => {
  const [selected, setSelected] = useState<Map<string, IngestFailureTarget>>(new Map());

  useEffect(() => {
    setSelected(new Map());
  }, [listed]);

  const toggle = useCallback((failure: IngestFailure, isSelected: boolean) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (isSelected) next.set(failureKey(failure), toRetryTarget(failure));
      else next.delete(failureKey(failure));

      return next;
    });
  }, []);

  const selectGroup = useCallback((group: IngestFailureGroup, isSelected: boolean) => {
    setSelected((prev) => {
      const next = new Map(prev);
      for (const failure of group.failures) {
        if (isSelected) next.set(failureKey(failure), toRetryTarget(failure));
        else next.delete(failureKey(failure));
      }

      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Map()), []);

  const keys = useMemo(() => new Set(selected.keys()), [selected]);
  const targets = useMemo(() => [...selected.values()], [selected]);

  return useMemo(() => ({ keys, targets, toggle, selectGroup, clear }), [keys, targets, toggle, selectGroup, clear]);
};
