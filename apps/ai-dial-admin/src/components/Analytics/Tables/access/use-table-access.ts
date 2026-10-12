'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  deleteRowPolicy,
  getRowPolicies,
  getTableAccess,
  putRowPolicy,
  updateTableAccess,
} from '@/src/app/[lang]/tables/actions';
import { AccessStatus, RoleRow, RoleSelection } from '@/src/components/Analytics/Tables/access/models';
import {
  applyAccessResult,
  buildRoleRows,
  emptyAccess,
  normalizeAccess,
  planAccessSave,
  planRoleRemoval,
} from '@/src/components/Analytics/Tables/access/utils';
import { AnalyticsTableAccessI18nKey, AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { QueryFilterNode } from '@/src/models/analytics/query';
import { RowPolicies, TableAccess, TableAccessUpdateResult } from '@/src/models/analytics/table';
import { ServerActionResponse } from '@/src/models/server-action';
import { getErrorNotification } from '@/src/utils/notification';

const FORBIDDEN = 403;

export interface RowPolicyResult {
  isOk: boolean;
  errorMessage?: string;
}

export interface TableAccessState {
  status: AccessStatus;
  rows: RoleRow[];
  access: TableAccess;
  policies: RowPolicies;
  // Offered only once both reads resolved and neither was forbidden: a tab that appears and vanishes is worse
  // than one that arrives late.
  isTabOffered: boolean;
  // The service merges per key, so a key sent replaces that whole list: a stale copy would drop another
  // admin's grant. Reads the lists again right before a change.
  readFreshAccess: () => Promise<TableAccess | null>;
  // `result` is absent when nothing changed and no request was made.
  saveGrants: (role: string, selection: RoleSelection) => Promise<{ isOk: boolean; result?: TableAccessUpdateResult }>;
  // A null filter removes the role's policy, and only when it has one. A refusal's message is returned: it
  // names the field the service objected to.
  saveRowPolicy: (role: string, filter: QueryFilterNode | null) => Promise<RowPolicyResult>;
  removeRole: (role: string) => Promise<boolean>;
}

// Read with the view, because the tab's presence depends on them. A 403 removes the tab without
// a notification: a viewer who cannot manage grants has nothing to be told.
export const useTableAccess = (name: string, isEnabled: boolean): TableAccessState => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const [status, setStatus] = useState<AccessStatus>(AccessStatus.Loading);
  const [access, setAccess] = useState<TableAccess>(emptyAccess);
  const [policies, setPolicies] = useState<RowPolicies>({});

  const notifyError = useCallback(
    (res: ServerActionResponse, fallback: string) =>
      showNotification(getErrorNotification(res.errorHeader || fallback, res.errorMessage, res.requestId)),
    [showNotification],
  );

  useEffect(() => {
    if (!isEnabled) return;

    let isActive = true;
    setStatus(AccessStatus.Loading);

    void Promise.all([getTableAccess(name), getRowPolicies(name)]).then(([accessRes, policiesRes]) => {
      if (!isActive) return;

      if (accessRes.status === FORBIDDEN || policiesRes.status === FORBIDDEN) {
        setStatus(AccessStatus.Forbidden);
        return;
      }
      if (!accessRes.success) notifyError(accessRes, t(AnalyticsTablesI18nKey.AccessLoadFailed));
      if (!policiesRes.success) notifyError(policiesRes, t(AnalyticsTableAccessI18nKey.RowPoliciesLoadFailed));
      if (!accessRes.success || !policiesRes.success) {
        setStatus(AccessStatus.Failed);
        return;
      }

      setAccess(normalizeAccess(accessRes.response));
      setPolicies(policiesRes.response?.policies ?? {});
      setStatus(AccessStatus.Ready);
    });

    return () => {
      isActive = false;
    };
    // Once per table: the mocked notification context in tests returns a fresh function every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, isEnabled]);

  const rows = useMemo(() => buildRoleRows(access, policies), [access, policies]);

  const readFreshAccess = useCallback(async (): Promise<TableAccess | null> => {
    const res = await getTableAccess(name);
    if (!res.success) {
      notifyError(res, t(AnalyticsTablesI18nKey.AccessLoadFailed));
      return null;
    }

    const fresh = normalizeAccess(res.response);
    setAccess(fresh);

    return fresh;
  }, [name, notifyError, t]);

  const saveGrants = useCallback(
    async (role: string, selection: RoleSelection) => {
      const fresh = await readFreshAccess();
      if (!fresh) return { isOk: false };

      const plan = planAccessSave(fresh, role, selection);
      if (!Object.keys(plan).length) return { isOk: true };

      const res = await updateTableAccess(name, plan);
      if (!res.success) {
        notifyError(res, t(AnalyticsTableAccessI18nKey.SaveFailed));
        return { isOk: false };
      }

      setAccess(applyAccessResult(fresh, res.response ?? plan));

      return { isOk: true, result: res.response };
    },
    [name, notifyError, readFreshAccess, t],
  );

  const saveRowPolicy = useCallback(
    async (role: string, filter: QueryFilterNode | null): Promise<RowPolicyResult> => {
      if (!filter && !policies[role]) return { isOk: true };

      const res = filter ? await putRowPolicy(name, role, { filter }) : await deleteRowPolicy(name, role);
      if (!res.success) {
        notifyError(res, t(AnalyticsTableAccessI18nKey.RowLimitSaveFailed));
        return { isOk: false, errorMessage: res.errorMessage };
      }

      if (filter) setPolicies((prev) => ({ ...prev, [role]: res.response ?? { filter } }));
      else setPolicies(({ [role]: _removed, ...rest }) => rest);

      return { isOk: true };
    },
    [name, notifyError, policies, t],
  );

  const removeRole = useCallback(
    async (role: string): Promise<boolean> => {
      const fresh = await readFreshAccess();
      if (!fresh) return false;

      const plan = planRoleRemoval(fresh, role);
      if (Object.keys(plan).length) {
        const res = await updateTableAccess(name, plan);
        if (!res.success) {
          notifyError(res, t(AnalyticsTableAccessI18nKey.RemoveFailed));
          return false;
        }
        setAccess(applyAccessResult(fresh, res.response ?? plan));
      }

      return (await saveRowPolicy(role, null)).isOk;
    },
    [name, notifyError, readFreshAccess, saveRowPolicy, t],
  );

  return {
    status,
    rows,
    access,
    policies,
    isTabOffered: isEnabled && (status === AccessStatus.Ready || status === AccessStatus.Failed),
    readFreshAccess,
    saveGrants,
    saveRowPolicy,
    removeRole,
  };
};
