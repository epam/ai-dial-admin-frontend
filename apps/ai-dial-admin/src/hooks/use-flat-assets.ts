'use client';

import { useCallback, useEffect, useState } from 'react';

import { FlatAssets, FlatReadResult } from '@/src/components/Assets/FlatAssetGrid/models';
import { readFlatAssets } from '@/src/components/Assets/FlatAssetGrid/readers';
import { AssetTabsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useGuardedRead } from '@/src/hooks/use-guarded-read';
import { useI18n } from '@/src/locales/client';
import { AssetListItem } from '@/src/models/dial/asset-list-item';
import { AssetSource } from '@/src/models/dial/asset-source';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification } from '@/src/utils/notification';

/**
 * A listing's Platform or config.json rows. Owns its own state and needs no folder context: nothing here reads
 * `filePath`, a folder cache or an expanded set. Loads on mount so a tab's count is known before the tab opens.
 */
export const useFlatAssets = (
  view: ApplicationRoute,
  source: AssetSource.Platform | AssetSource.ConfigFile,
  /** A source the listing does not offer is never read. */
  isEnabled = true,
): FlatAssets => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const { run } = useGuardedRead();
  const [rows, setRows] = useState<AssetListItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(isEnabled);
  const [hasError, setHasError] = useState(false);

  const refetch = useCallback(async () => {
    setIsLoading(true);

    let result: FlatReadResult | undefined;
    try {
      result = await run(() => readFlatAssets(view, source));
    } catch {
      result = { success: false };
    }

    // A stale answer (a newer read started, or the component left) writes nothing.
    if (result === undefined) {
      return;
    }

    if (result.success) {
      setRows(result.rows);
      setIsLoaded(true);
      setHasError(false);
    } else {
      setIsLoaded(false);
      setHasError(true);
      showNotification(getErrorNotification(result.errorHeader ?? t(AssetTabsI18nKey.LoadError), result.errorMessage));
    }
    setIsLoading(false);
  }, [run, view, source, showNotification, t]);

  useEffect(() => {
    if (!isEnabled) {
      return;
    }
    void refetch();
    // Reads on mount and when the view or source changes; `refetch` also changes with `t`, which must not re-read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, source, isEnabled]);

  return { rows, count: isLoaded ? rows.length : undefined, isLoading, hasError, refetch };
};
