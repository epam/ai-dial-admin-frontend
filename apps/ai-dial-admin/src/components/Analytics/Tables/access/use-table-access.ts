'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { deleteTableAccessEntry, getTableAccess, putTableAccessEntry } from '@/src/app/[lang]/tables/actions';
import { AccessChangeOutcome, AccessStatus, RoleRow } from '@/src/components/Analytics/Tables/access/models';
import { buildRoleRows, isEntryEmpty } from '@/src/components/Analytics/Tables/access/utils';
import { AnalyticsTableAccessI18nKey, AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import {
  IneffectiveGrant,
  TableAccessConfig,
  TableAccessEntry,
  TableAccessEntryResult,
} from '@/src/models/analytics/table';
import { ServerActionResponse } from '@/src/models/server-action';
import { getErrorNotification } from '@/src/utils/notification';

const FORBIDDEN = 403;
const ACCESS_CONFLICT = 'access_conflict';

export interface SaveEntryResult {
  outcome: AccessChangeOutcome;
  result?: TableAccessEntryResult;
  errorMessage?: string;
}

export interface TableAccessState {
  status: AccessStatus;
  rows: RoleRow[];
  roles: Record<string, TableAccessEntry>;
  warnings: IneffectiveGrant[];
  // Offered only once the read resolved and was not forbidden: a tab that appears and vanishes is worse
  // than one that arrives late.
  isTabOffered: boolean;
  reload: () => Promise<TableAccessConfig | null>;
  saveEntry: (role: string, entry: TableAccessEntry) => Promise<SaveEntryResult>;
  removeRole: (role: string) => Promise<AccessChangeOutcome>;
}

const EMPTY_ROLES: Record<string, TableAccessEntry> = {};
const NO_WARNINGS: IneffectiveGrant[] = [];

// Read with the view, because the tab's presence depends on it. A 403 removes the tab without
// a notification: a viewer who cannot manage access has nothing to be told.
export const useTableAccess = (name: string, isEnabled: boolean): TableAccessState => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const [status, setStatus] = useState<AccessStatus>(AccessStatus.Loading);
  const [roles, setRoles] = useState<Record<string, TableAccessEntry>>(EMPTY_ROLES);
  const [warnings, setWarnings] = useState<IneffectiveGrant[]>(NO_WARNINGS);
  const generation = useRef(0);

  const notifyError = useCallback(
    (res: ServerActionResponse, fallback: string) =>
      showNotification(getErrorNotification(res.errorHeader || fallback, res.errorMessage, res.requestId)),
    [showNotification],
  );

  const applyConfig = useCallback((config?: TableAccessConfig) => {
    generation.current = config?.generation ?? 0;
    setRoles(config?.roles ?? EMPTY_ROLES);
    setWarnings(config?.ineffective_grants ?? NO_WARNINGS);
  }, []);

  useEffect(() => {
    if (!isEnabled) return;

    let isActive = true;
    setStatus(AccessStatus.Loading);

    const load = async () => {
      const res = await getTableAccess(name);
      if (!isActive) return;

      if (res.status === FORBIDDEN) {
        setStatus(AccessStatus.Forbidden);
        return;
      }
      if (!res.success) {
        notifyError(res, t(AnalyticsTablesI18nKey.AccessLoadFailed));
        setStatus(AccessStatus.Failed);
        return;
      }

      applyConfig(res.response);
      setStatus(AccessStatus.Ready);
    };

    void load();

    return () => {
      isActive = false;
    };
    // Once per table: the mocked notification context in tests returns a fresh function every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, isEnabled]);

  const rows = useMemo(() => buildRoleRows(roles, warnings), [roles, warnings]);

  const reload = useCallback(async (): Promise<TableAccessConfig | null> => {
    const res = await getTableAccess(name);
    if (!res.success || !res.response) {
      notifyError(res, t(AnalyticsTablesI18nKey.AccessLoadFailed));
      return null;
    }

    applyConfig(res.response);

    return res.response;
  }, [name, notifyError, applyConfig, t]);

  const saveEntry = useCallback(
    async (role: string, entry: TableAccessEntry): Promise<SaveEntryResult> => {
      const res = await putTableAccessEntry(name, role, { ...entry, generation: generation.current });
      if (!res.success) {
        if (res.errorHeader === ACCESS_CONFLICT) return { outcome: AccessChangeOutcome.Conflict };

        notifyError(res, t(AnalyticsTableAccessI18nKey.SaveFailed));

        return { outcome: AccessChangeOutcome.Failed, errorMessage: res.errorMessage };
      }

      const stored = res.response ?? { ...entry, generation: generation.current, role, ineffective_grants: [] };
      generation.current = stored.generation;
      setRoles(({ [role]: _replaced, ...rest }) =>
        isEntryEmpty(stored)
          ? rest
          : { ...rest, [role]: { privileges: stored.privileges, rows: stored.rows, columns: stored.columns } },
      );
      await reload();

      return { outcome: AccessChangeOutcome.Done, result: res.response };
    },
    [name, notifyError, reload, t],
  );

  const removeRole = useCallback(
    async (role: string): Promise<AccessChangeOutcome> => {
      const res = await deleteTableAccessEntry(name, role, generation.current);
      if (!res.success) {
        notifyError(res, t(AnalyticsTableAccessI18nKey.RemoveFailed));
        if (res.errorHeader !== ACCESS_CONFLICT) return AccessChangeOutcome.Failed;

        await reload();

        return AccessChangeOutcome.Conflict;
      }

      setRoles(({ [role]: _removed, ...rest }) => rest);
      await reload();

      return AccessChangeOutcome.Done;
    },
    [name, notifyError, reload, t],
  );

  return {
    status,
    rows,
    roles,
    warnings,
    isTabOffered: isEnabled && (status === AccessStatus.Ready || status === AccessStatus.Failed),
    reload,
    saveEntry,
    removeRole,
  };
};
