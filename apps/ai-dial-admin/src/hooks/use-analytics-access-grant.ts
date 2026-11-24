import { useEffect, useState } from 'react';

import { getTables } from '@/src/app/[lang]/tables/actions';
import { useAppContext } from '@/src/context/AppContext';

export const useAnalyticsAccessGrant = (isActive: boolean): boolean => {
  const { isEnableAuth } = useAppContext();
  const [canGrant, setCanGrant] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setCanGrant(false);
      return;
    }

    let isCurrent = true;
    const readGrant = async () => {
      try {
        const res = await getTables();
        const grant = res.success ? (res.response?.[0]?.permissions?.grant ?? !isEnableAuth) : false;
        if (isCurrent) setCanGrant(grant);
      } catch {
        if (isCurrent) setCanGrant(false);
      }
    };

    void readGrant();
    return () => {
      isCurrent = false;
    };
  }, [isActive, isEnableAuth]);

  return canGrant;
};
