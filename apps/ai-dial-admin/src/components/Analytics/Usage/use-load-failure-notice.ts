'use client';

import { useCallback, useRef } from 'react';

import { useNotification } from '@/src/context/NotificationContext';
import { NotificationType } from '@/src/models/notification';

export interface LoadFailureNotice {
  /** Raises one notification per distinct message; repeats within a load are dropped. */
  report: (error?: string) => void;
  /** Starts a new load, so the same failure is worth stating again. */
  reset: () => void;
}

/**
 * One notification per failure, not one per request.
 *
 * The page issues up to nine requests across two hooks, and a backend that is down fails all of
 * them with the same message — nine toasts saying one thing. Messages are deduplicated for the
 * life of a load and the set is cleared whenever a new one starts, so the page holds one notice
 * and hands it to both hooks rather than each keeping its own.
 */
export const useLoadFailureNotice = (title: string): LoadFailureNotice => {
  const { showNotification } = useNotification();
  const seen = useRef(new Set<string>());

  /*
   * Both callbacks are stable whatever the provider hands back. They gate the page's data effects,
   * and a provider that rebuilds `showNotification` — or a test whose mock returns a fresh object
   * per render — would otherwise change their identity on every pass and re-issue every request
   * forever.
   */
  const notify = useRef(showNotification);
  notify.current = showNotification;

  const titleRef = useRef(title);
  titleRef.current = title;

  const report = useCallback((error?: string) => {
    const key = error ?? '';

    if (seen.current.has(key)) {
      return;
    }

    seen.current.add(key);
    notify.current({ type: NotificationType.error, title: titleRef.current, description: error });
  }, []);

  const reset = useCallback(() => seen.current.clear(), []);

  return { report, reset };
};
