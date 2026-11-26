import { useEffect, useState } from 'react';

import { getTableAccess } from '@/src/app/[lang]/tables/actions';
import { ExportI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { getErrorNotification } from '@/src/utils/notification';

interface TableAccessRoles {
  roles: string[];
  isLoading: boolean;
  isFailed: boolean;
}

export const useTableAccessRoles = (tableName: string | undefined): TableAccessRoles => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(!!tableName);
  const [isFailed, setIsFailed] = useState(false);

  useEffect(() => {
    if (!tableName) {
      return;
    }

    let isCurrent = true;
    const readRoles = async () => {
      try {
        const res = await getTableAccess(tableName);
        if (!isCurrent) return;
        if (res.success) {
          setRoles(Object.keys(res.response?.roles ?? {}));
        } else {
          setIsFailed(true);
          showNotification(
            getErrorNotification(t(ExportI18nKey.AnalyticsRolesReadFailed), res.errorMessage, res.requestId),
          );
        }
      } catch {
        if (!isCurrent) return;
        setIsFailed(true);
        showNotification(getErrorNotification(t(ExportI18nKey.AnalyticsRolesReadFailed)));
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    void readRoles();
    return () => {
      isCurrent = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableName]);

  return { roles, isLoading, isFailed };
};
