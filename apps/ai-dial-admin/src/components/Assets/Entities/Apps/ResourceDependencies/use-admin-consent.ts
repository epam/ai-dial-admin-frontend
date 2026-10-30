'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  getAdminConsentStatus,
  grantAdminConsent,
  withdrawAdminConsent,
} from '@/src/app/[lang]/assets-applications/actions';
import { ResourceDependenciesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { AdminConsentStatus } from '@/src/models/dial/resource-dependency';
import { ServerActionResponse } from '@/src/models/server-action';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';

/**
 * Reads Core's admin-consent status for the application and re-reads it whenever `etag` changes (a
 * successful Save) and after every approve / revoke, so the block never shows a state older than the
 * last action. Any failed read — 403 for a non-admin, 404 for a Core without the feature — is reported
 * as `hasFailed`, which the tab renders as its no-data state.
 */
export const useAdminConsent = (appPath: string, etag: string) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const getReqRef = useRef(useProtectedRequest());
  const latestReadRef = useRef(0);
  const [status, setStatus] = useState<AdminConsentStatus>();
  const [isLoading, setIsLoading] = useState(true);
  const [hasFailed, setHasFailed] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const refresh = useCallback(async () => {
    const readId = ++latestReadRef.current;
    setIsLoading(true);
    const res: ServerActionResponse<AdminConsentStatus> = await getReqRef.current(getAdminConsentStatus, appPath);
    // A newer read supersedes this one, whichever finishes last.
    if (readId !== latestReadRef.current) {
      return;
    }
    setStatus(res.success ? res.response : undefined);
    setHasFailed(!res.success || !res.response);
    setIsLoading(false);
  }, [appPath]);

  useEffect(() => {
    void refresh();
  }, [refresh, etag]);

  const mutate = useCallback(
    async (
      action: (appPath: string) => Promise<ServerActionResponse>,
      successTitle: ResourceDependenciesI18nKey,
      successDescription: ResourceDependenciesI18nKey,
    ) => {
      setIsMutating(true);
      const res = await getReqRef.current(action, appPath);
      showNotification(
        res.success
          ? getSuccessNotification(t(successTitle), t(successDescription))
          : getErrorNotification(res.errorHeader, res.errorMessage, res.requestId),
      );
      await refresh();
      setIsMutating(false);
    },
    [appPath, refresh, showNotification, t],
  );

  const approve = useCallback(
    () =>
      mutate(
        grantAdminConsent,
        ResourceDependenciesI18nKey.ApproveSuccess,
        ResourceDependenciesI18nKey.ApproveSuccessDescription,
      ),
    [mutate],
  );

  const revoke = useCallback(
    () =>
      mutate(
        withdrawAdminConsent,
        ResourceDependenciesI18nKey.RevokeSuccess,
        ResourceDependenciesI18nKey.RevokeSuccessDescription,
      ),
    [mutate],
  );

  return { status, isLoading, hasFailed, isMutating, approve, revoke };
};
