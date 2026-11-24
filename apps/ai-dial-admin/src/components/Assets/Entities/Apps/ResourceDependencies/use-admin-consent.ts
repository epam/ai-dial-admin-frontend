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
import { AdminConsentStatus, ResourceDependency } from '@/src/models/dial/resource-dependency';
import { ServerActionResponse } from '@/src/models/server-action';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { toApprovedResources } from './utils/resources';

/**
 * Reads Core's admin-consent status for the application and re-reads it whenever the saved
 * dependencies change (a successful Save, once its `router.refresh()` has delivered the new server
 * data) and after every approve / revoke, so the block never shows a state older than the
 * last action. Any failed read — 403 for a non-admin, 404 for a Core without the feature — is reported
 * as `hasFailed`, which the tab renders as its no-data state.
 */
export const useAdminConsent = (appPath: string, savedDependencies?: ResourceDependency[]) => {
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
    let res: ServerActionResponse<AdminConsentStatus> | undefined;
    try {
      res = await getReqRef.current(getAdminConsentStatus, appPath);
    } catch {
      res = undefined;
    } finally {
      // A newer read supersedes this one, whichever finishes last.
      if (readId === latestReadRef.current) {
        setStatus(res?.success ? res.response : undefined);
        setHasFailed(!res?.success || !res.response);
        setIsLoading(false);
      }
    }
  }, [appPath]);

  // Keyed on the server-provided dependencies, not the view's local etag: the etag is set the moment a
  // Save succeeds, before `router.push` / `router.refresh()` run, and a server action in flight during
  // that navigation never resolves, leaving the block loading. The saved dependencies only change once
  // the refreshed data has landed, so the read can't be interrupted.
  useEffect(() => {
    void refresh();
  }, [refresh, savedDependencies]);

  const mutate = useCallback(
    async (
      action: () => Promise<ServerActionResponse>,
      successTitle: ResourceDependenciesI18nKey,
      successDescription: ResourceDependenciesI18nKey,
    ) => {
      setIsMutating(true);
      const res = await getReqRef.current(action);
      showNotification(
        res.success
          ? getSuccessNotification(t(successTitle), t(successDescription))
          : getErrorNotification(res.errorHeader, res.errorMessage, res.requestId),
      );
      await refresh();
      setIsMutating(false);
    },
    [refresh, showNotification, t],
  );

  const approve = useCallback(
    () =>
      mutate(
        () => grantAdminConsent(appPath, toApprovedResources(savedDependencies)),
        ResourceDependenciesI18nKey.ApproveSuccess,
        ResourceDependenciesI18nKey.ApproveSuccessDescription,
      ),
    [appPath, mutate, savedDependencies],
  );

  const revoke = useCallback(
    () =>
      mutate(
        () => withdrawAdminConsent(appPath),
        ResourceDependenciesI18nKey.RevokeSuccess,
        ResourceDependenciesI18nKey.RevokeSuccessDescription,
      ),
    [appPath, mutate],
  );

  return { status, isLoading, hasFailed, isMutating, approve, revoke };
};
