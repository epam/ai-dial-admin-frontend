'use client';

import { useCallback, useEffect, useState } from 'react';

import { listSavedQueries } from '@/src/app/[lang]/query-builder/actions';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { SavedQuery, SavedQueryScope } from '@/src/models/analytics/saved-query';
import { getErrorNotification } from '@/src/utils/notification';

export interface SavedQueriesState {
  personal: SavedQuery[];
  common: SavedQuery[];
  isLoading: boolean;
  queriesFor: (scope: SavedQueryScope) => SavedQuery[];
  loadScope: (scope: SavedQueryScope) => Promise<void>;
  refreshAll: () => Promise<void>;
}

// The caller's own rows are fetched once on mount, serving the library's first open and the save
// dialog's tag suggestions. Common rows wait until their tab is opened: the service deliberately
// returns full bodies rather than a projection, so a scope nobody looks at is not worth fetching.
export const useSavedQueries = (): SavedQueriesState => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const [personal, setPersonal] = useState<SavedQuery[]>([]);
  const [common, setCommon] = useState<SavedQuery[]>([]);
  const [loadedScopes, setLoadedScopes] = useState<SavedQueryScope[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadScope = useCallback(
    async (scope: SavedQueryScope) => {
      setIsLoading(true);
      const queries = await listSavedQueries(scope);
      if (queries) {
        if (scope === SavedQueryScope.Personal) setPersonal(queries);
        else setCommon(queries);
        setLoadedScopes((prev) => (prev.includes(scope) ? prev : [...prev, scope]));
      } else {
        showNotification(getErrorNotification(t(QueryBuilderI18nKey.SavedQueriesLoadFailed)));
      }
      setIsLoading(false);
    },
    [showNotification, t],
  );

  useEffect(() => {
    void loadScope(SavedQueryScope.Personal);
  }, [loadScope]);

  // After a write, only a scope already on screen is worth re-reading — refreshing an untouched
  // Common tab would fetch full bodies nobody has asked to see.
  const refreshAll = useCallback(async () => {
    await Promise.all(loadedScopes.map((scope) => loadScope(scope)));
  }, [loadedScopes, loadScope]);

  const queriesFor = useCallback(
    (scope: SavedQueryScope) => (scope === SavedQueryScope.Personal ? personal : common),
    [personal, common],
  );

  return {
    personal,
    common,
    isLoading,
    queriesFor,
    loadScope,
    refreshAll,
  };
};
