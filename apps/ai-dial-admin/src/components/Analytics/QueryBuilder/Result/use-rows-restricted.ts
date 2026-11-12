'use client';

import { useEffect, useState } from 'react';

import { getTable } from '@/src/app/[lang]/tables/actions';

export const useRowsRestricted = (source: string | undefined, isEnabled: boolean): boolean => {
  const [restrictedBySource, setRestrictedBySource] = useState<Record<string, boolean>>({});
  const isKnown = !!source && source in restrictedBySource;

  useEffect(() => {
    if (!isEnabled || !source || isKnown) return;

    let isActive = true;
    const load = async () => {
      let isRestricted = false;
      try {
        const res = await getTable(source);
        isRestricted = !!res.response?.permissions?.rows_restricted;
      } catch {
        isRestricted = false;
      }
      if (isActive) setRestrictedBySource((prev) => ({ ...prev, [source]: isRestricted }));
    };
    void load();

    return () => {
      isActive = false;
    };
  }, [source, isEnabled, isKnown]);

  return isEnabled && !!source && !!restrictedBySource[source];
};
