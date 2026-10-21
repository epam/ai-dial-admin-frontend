'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';

/**
 * The two guards every read in this console needs, and nothing else.
 *
 * **Only the newest read may write.** A Read-again and the re-read an action triggers land in whichever
 * order the service answers them; without a generation counter the loser overwrites the winner and the
 * page states the answer from before the thing it just did. **Nothing writes after unmount.** A React
 * state update on an unmounted component is a leak the console pays for on every navigation away from a
 * page with an outstanding request.
 *
 * Both are four lines each, and four lines copied three times is the shape that goes wrong in one place
 * only: the version that forgets to bump the counter on its cancel path, so a read already in flight
 * stays valid and lands anyway.
 *
 * `run` wraps the caller's own read. It resolves to `undefined` — and the caller writes nothing — when
 * the answer is stale or the component is gone; otherwise it hands back whatever the read returned.
 * `cancel` invalidates whatever is in flight without issuing anything, which is what a caller that has
 * just learned it may not ask needs.
 */
export interface GuardedRead {
  /** Starts a new generation. Everything in flight under an older one can no longer write. */
  run: <T>(read: () => Promise<T>) => Promise<T | undefined>;
  /**
   * Reads under the **current** generation instead of starting one — for a read that extends what is
   * already on screen rather than replacing it, such as the next page of a list. It is invalidated by
   * the next `run`, which is what stops a page appended after a filter change from joining a result
   * set nobody asked for.
   */
  follow: <T>(read: () => Promise<T>) => Promise<T | undefined>;
  cancel: () => void;
  /** Whether the component is still mounted, for a caller that writes outside these. */
  isMounted: () => boolean;
}

export const useGuardedRead = (): GuardedRead => {
  const isMounted = useRef(true);
  const latest = useRef(0);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  const guarded = useCallback(async <T>(generation: number, read: () => Promise<T>): Promise<T | undefined> => {
    const answer = await read();

    if (!isMounted.current || generation !== latest.current) return undefined;

    return answer;
  }, []);

  const run = useCallback(
    <T>(read: () => Promise<T>): Promise<T | undefined> => guarded(++latest.current, read),
    [guarded],
  );

  const follow = useCallback(
    <T>(read: () => Promise<T>): Promise<T | undefined> => guarded(latest.current, read),
    [guarded],
  );

  // Bumps the counter without issuing anything, so a read already in flight can no longer write.
  const cancel = useCallback(() => {
    latest.current += 1;
  }, []);

  const checkMounted = useCallback(() => isMounted.current, []);

  // One object for the hook's lifetime. A fresh one per render would change the identity of every
  // `useCallback` that depends on it, and a read effect depending on that callback would re-fire on
  // every render — a request per keystroke on any page that also holds a text field.
  return useMemo(() => ({ run, follow, cancel, isMounted: checkMounted }), [run, follow, cancel, checkMounted]);
};
