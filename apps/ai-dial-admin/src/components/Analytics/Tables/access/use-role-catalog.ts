'use client';

import { useEffect, useMemo, useState } from 'react';

import { getRoles } from '@/src/app/[lang]/tables/actions';
import { AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { getErrorNotification } from '@/src/utils/notification';

// `getRoles` reads both populations of Core roles (written through its API, declared in its configuration
// file). The bare name is the raw provider role the service matches grants against.
export const useRoleCatalog = (isEnabled: boolean): { roles: string[]; isLoading: boolean } => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const [catalog, setCatalog] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(isEnabled);

  useEffect(() => {
    if (!isEnabled) return;

    let isActive = true;
    void getRoles().then((res) => {
      if (!isActive) return;

      setCatalog(res.roles.map((role) => role.displayName ?? '').filter(Boolean));
      setIsLoading(false);
      res.warnings.forEach((warning) =>
        showNotification(getErrorNotification(t(AnalyticsTablesI18nKey.RolesLoadFailed), t(warning))),
      );
    });

    return () => {
      isActive = false;
    };
    // Once per opening: the mocked notification context in tests returns a fresh function every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnabled]);

  const roles = useMemo(
    () => [...catalog].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })),
    [catalog],
  );

  return { roles, isLoading };
};
