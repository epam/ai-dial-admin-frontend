'use client';

import { useEffect, useState } from 'react';

import { getUsageCallerSource } from '@/src/app/[lang]/dashboards/actions';
import { CallerSource } from '@/src/components/Analytics/Usage/models';

export const useUsageCallerSource = (): CallerSource | null => {
  const [callerSource, setCallerSource] = useState<CallerSource | null>(null);

  useEffect(() => {
    let isCurrent = true;

    const check = async () => {
      try {
        const source = await getUsageCallerSource();
        if (isCurrent) setCallerSource(source);
      } catch {
        if (isCurrent) setCallerSource(CallerSource.Hash);
      }
    };

    void check();

    return () => {
      isCurrent = false;
    };
  }, []);

  return callerSource;
};
