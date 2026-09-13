import { useEffect, useRef, useState } from 'react';

import { ConfigFileListResult, ConfigFileReadResult } from '@/src/models/dial/config-file';

interface ConfigFileEntityListState<T> {
  data: T[];
  isLoading: boolean;
}

/**
 * Fetches a config-file entity type's full population the first time `showConfigFiles` becomes
 * `true`, and never again for the lifetime of this hook instance — the `config-file-entity-views`
 * list-swap is meant to cost nothing until a user actually opts into it, and re-fetching on every
 * toggle-off/toggle-on would defeat that. A failed read leaves `data` empty rather than throwing;
 * the caller's own list component renders its normal empty state.
 */
export const useConfigFileEntityList = <T>(
  showConfigFiles: boolean,
  fetchList: () => Promise<ConfigFileReadResult<ConfigFileListResult<T>>>,
): ConfigFileEntityListState<T> => {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!showConfigFiles || hasFetchedRef.current) {
      return;
    }
    hasFetchedRef.current = true;
    setIsLoading(true);

    fetchList()
      .then((result) => {
        if (result.success) {
          setData(result.data.entities);
        }
      })
      .finally(() => setIsLoading(false));
    // `fetchList` is a fresh closure per render from its caller — only `showConfigFiles` should
    // re-trigger this, and `hasFetchedRef` already prevents a second run once it has.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showConfigFiles]);

  return { data, isLoading };
};
