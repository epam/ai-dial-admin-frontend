'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getEntityTracePage } from '@/src/app/[lang]/sessions/actions';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { EntityTraceCursor } from '@/src/models/analytics/entity-traces';
import { SessionTraceGroup } from '@/src/models/analytics/sessions-trace';
import { TimeRange } from '@/src/models/time-range';
import { ApplicationRoute } from '@/src/types/routes';
import { mergeEntityTraceGroups } from '@/src/utils/analytics/entity-trace-groups';

const FORBIDDEN_STATUS = 403;

interface Params {
  route: ApplicationRoute;
  entityName: string | null;
  timeRange: TimeRange;
  // Bumped by Refresh: re-reads from the newest call even when the period itself did not change.
  refreshToken: number;
  // False until access is known to be granted and the entity has a name to match: a read issued before then
  // is either refused or reads nothing.
  isEnabled: boolean;
}

export const useEntityTraces = ({ route, entityName, timeRange, refreshToken, isEnabled }: Params) => {
  const [groups, setGroups] = useState<SessionTraceGroup[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  // A refusal on a page read, after the access check passed — a grant withdrawn while the tab is open. It is
  // the no-access state, not a load failure: retrying cannot succeed.
  const [isRefused, setIsRefused] = useState(false);
  const getReqRef = useRef(useProtectedRequest());
  const cursorRef = useRef<EntityTraceCursor | null>(null);
  const isFetchingRef = useRef(false);
  // Which reset a read belongs to. A page answered after the period changed is the old period's, and
  // appending it would mix two periods in one listing.
  const generationRef = useRef(0);

  const fromMs = timeRange.startDate.getTime();
  const toMs = timeRange.endDate.getTime();

  const loadPage = useCallback(async () => {
    if (isFetchingRef.current) {
      return;
    }
    isFetchingRef.current = true;
    const generation = generationRef.current;
    setIsLoading(true);

    try {
      const result = await getReqRef.current(getEntityTracePage, route, entityName, fromMs, toMs, cursorRef.current);

      if (generation !== generationRef.current) {
        return;
      }

      // A failed page stops automatic paging — the scroll observer would otherwise re-request it in a loop —
      // and keeps the cursor, so a retry asks for the same page again.
      if (!result?.success || !result.response) {
        setIsRefused(result?.status === FORBIDDEN_STATUS);
        setHasLoadError(true);
        setHasMore(false);
        return;
      }

      const page = result.response;
      cursorRef.current = page.cursor ?? cursorRef.current;
      setGroups((shown) => mergeEntityTraceGroups(shown, page.groups));
      setHasMore(page.hasMore);
      setHasLoadError(false);
    } catch {
      if (generation === generationRef.current) {
        setHasLoadError(true);
        setHasMore(false);
      }
    } finally {
      if (generation === generationRef.current) {
        isFetchingRef.current = false;
        setIsLoading(false);
      }
    }
  }, [route, entityName, fromMs, toMs]);

  useEffect(() => {
    generationRef.current += 1;
    cursorRef.current = null;
    isFetchingRef.current = false;
    setGroups([]);
    setHasMore(false);
    setHasLoadError(false);
    setIsRefused(false);

    if (!isEnabled) {
      setIsLoading(false);
      return;
    }

    void loadPage();
  }, [loadPage, refreshToken, isEnabled]);

  const onLoadMore = useCallback(() => {
    if (hasMore && !isFetchingRef.current) {
      void loadPage();
    }
  }, [hasMore, loadPage]);

  const onRetry = useCallback(() => {
    void loadPage();
  }, [loadPage]);

  return { groups, hasMore, isLoading, hasLoadError, isRefused, onLoadMore, onRetry };
};
