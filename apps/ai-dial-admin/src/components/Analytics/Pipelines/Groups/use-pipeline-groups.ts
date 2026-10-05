'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getPipelineGroups } from '@/src/app/[lang]/pipelines/actions';
import { GROUPS_LIMIT } from '@/src/constants/analytics/pipeline-groups';
import { PipelineGroup } from '@/src/models/analytics/pipeline-groups';

export interface PipelineGroupsRead {
  groups: PipelineGroup[];
  isLoading: boolean;
  /** The read failed; never the empty state, which says the runner holds no groups. */
  hasFailed: boolean;
  errorMessage?: string;
  reload: () => Promise<void>;
}

/**
 * The pipeline's groups, in one read of the whole window the runner serves. There is no cursor to follow, so
 * there is nothing to page; a reload replaces the rows rather than appending to them.
 */
export const usePipelineGroups = (pipelineName: string): PipelineGroupsRead => {
  const [groups, setGroups] = useState<PipelineGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFailed, setHasFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  // Only the latest read may land: a reload started after a queue must not be overwritten by the read the tab
  // opened with.
  const readId = useRef(0);

  const reload = useCallback(async () => {
    const id = ++readId.current;
    setIsLoading(true);

    try {
      const res = await getPipelineGroups(pipelineName, GROUPS_LIMIT);
      if (id !== readId.current) return;

      setHasFailed(!res.success);
      setErrorMessage(res.success ? undefined : res.errorMessage);
      if (res.success) setGroups(res.response ?? []);
    } catch {
      if (id !== readId.current) return;

      setHasFailed(true);
      setErrorMessage(undefined);
    } finally {
      if (id === readId.current) setIsLoading(false);
    }
  }, [pipelineName]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return useMemo(
    () => ({ groups, isLoading, hasFailed, errorMessage, reload }),
    [groups, isLoading, hasFailed, errorMessage, reload],
  );
};
