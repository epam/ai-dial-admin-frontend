'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { listIngestFailures } from '@/src/app/[lang]/tables/actions';
import { useGuardedRead } from '@/src/hooks/use-guarded-read';
import { IngestFailureState } from '@/src/models/analytics/ingest-failure';

export interface IngestFailuresCount {
  parked?: number;
  isUnavailable: boolean;
  reload: () => Promise<void>;
}

export const useIngestFailuresCount = (isAsked: boolean): IngestFailuresCount => {
  const guard = useGuardedRead();

  const [parked, setParked] = useState<number | undefined>(undefined);
  const [isUnavailable, setIsUnavailable] = useState(false);

  const reload = useCallback(async () => {
    if (!isAsked) {
      guard.cancel();
      return;
    }

    const res = await guard.run(async () => {
      try {
        return await listIngestFailures({ state: IngestFailureState.Parked, limit: 1 });
      } catch {
        return null;
      }
    });

    if (res === undefined) return;

    if (res?.status === 404) {
      setIsUnavailable(true);
      setParked(undefined);
      return;
    }

    setIsUnavailable(false);
    setParked(res?.success && res.response ? res.response.total : undefined);
  }, [isAsked, guard]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return useMemo(() => ({ parked, isUnavailable, reload }), [parked, isUnavailable, reload]);
};
