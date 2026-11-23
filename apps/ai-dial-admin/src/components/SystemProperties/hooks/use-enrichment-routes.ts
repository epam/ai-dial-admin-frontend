import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isEqual } from 'lodash';

import { getEnrichmentRoutes, saveEnrichmentRoutes } from '@/src/app/[lang]/system-properties/actions';
import { ErrorI18nKey, SystemPropertiesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { EnrichmentRoute, EnrichmentRouteRow } from '@/src/models/analytics/enrichment-routes';
import { ServerActionResponse } from '@/src/models/server-action';
import {
  createRouteRow,
  getRouteRowProblems,
  toRoutePairs,
  toRouteRows,
} from '@/src/utils/analytics/enrichment-routes';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';

export const useEnrichmentRoutes = (isActive: boolean) => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const hasStartedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isReadFailed, setIsReadFailed] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState<EnrichmentRoute[]>([]);
  const [rows, setRows] = useState<EnrichmentRouteRow[]>([]);

  const notifyFailure = useCallback(
    (title: string, read: ServerActionResponse) => {
      showNotification(getErrorNotification(read.errorHeader ?? title, read.errorMessage, read.requestId));
    },
    [showNotification],
  );

  useEffect(() => {
    if (!isActive || hasStartedRef.current) {
      return;
    }
    hasStartedRef.current = true;

    const load = async () => {
      let read: ServerActionResponse<EnrichmentRoute[]>;
      try {
        read = await getEnrichmentRoutes();
      } catch {
        read = { success: false };
      }

      if (read.success) {
        const stored = read.response ?? [];
        setSavedRoutes(stored);
        setRows(toRouteRows(stored));
      } else {
        setIsReadFailed(true);
        notifyFailure(t(SystemPropertiesI18nKey.EnrichmentRoutesReadFailed), read);
      }

      setIsLoading(false);
    };

    void load();
  }, [isActive, notifyFailure, t]);

  const problems = useMemo(() => getRouteRowProblems(rows), [rows]);
  const isValid = Object.keys(problems).length === 0;

  const isChanged = useMemo(
    () => !isLoading && !isReadFailed && !isEqual(toRoutePairs(rows), savedRoutes),
    [isLoading, isReadFailed, rows, savedRoutes],
  );

  const onAddRow = useCallback(() => {
    setRows((prev) => [...prev, createRouteRow()]);
  }, []);

  const onRemoveRow = useCallback((id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  }, []);

  const onChangeRow = useCallback((id: string, patch: Partial<EnrichmentRoute>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }, []);

  const onSave = useCallback(async () => {
    const pairs = toRoutePairs(rows);
    let res: ServerActionResponse<EnrichmentRoute[]>;
    try {
      res = await saveEnrichmentRoutes(pairs);
    } catch {
      showNotification(getErrorNotification(t(ErrorI18nKey.Error), t(ErrorI18nKey.TryAgainLater)));
      return;
    }

    if (res.success) {
      const stored = res.response ?? pairs;
      setSavedRoutes(stored);
      setRows(toRouteRows(stored));
      showNotification(getSuccessNotification(t(SystemPropertiesI18nKey.EnrichmentRoutesSaved)));
    } else {
      notifyFailure(t(ErrorI18nKey.Error), res);
    }
  }, [notifyFailure, rows, showNotification, t]);

  const onDiscard = useCallback(() => {
    setRows(toRouteRows(savedRoutes));
  }, [savedRoutes]);

  return {
    rows,
    problems,
    isLoading,
    isReadFailed,
    isValid,
    isChanged,
    onAddRow,
    onRemoveRow,
    onChangeRow,
    onSave,
    onDiscard,
  };
};

export type EnrichmentRoutesState = ReturnType<typeof useEnrichmentRoutes>;
