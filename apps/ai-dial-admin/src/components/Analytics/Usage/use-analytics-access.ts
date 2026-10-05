'use client';

import { useEffect, useState } from 'react';

import { getIsAnalyticsForbidden } from '@/src/app/[lang]/dashboards/actions';

/**
 * Whether the analytics service refuses the current user: null while it is being asked. The page
 * asks on the server before it renders; a tab inside an entity view renders on the client, so it
 * asks once on mount and draws nothing that reads until it has the answer — a refused user would
 * otherwise get a dashboard of empty cards and a failure notification.
 */
export const useAnalyticsAccess = (): boolean | null => {
  const [isForbidden, setIsForbidden] = useState<boolean | null>(null);

  useEffect(() => {
    let isCurrent = true;

    const check = async () => {
      try {
        const isRefused = await getIsAnalyticsForbidden();
        if (isCurrent) setIsForbidden(isRefused);
      } catch {
        // The check failing is not a refusal: the dashboard's own requests report what went wrong.
        if (isCurrent) setIsForbidden(false);
      }
    };

    void check();

    return () => {
      isCurrent = false;
    };
  }, []);

  return isForbidden;
};
