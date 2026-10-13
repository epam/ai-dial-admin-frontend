'use client';

import { useEffect, useRef } from 'react';

import { useGuardedRead } from '@/src/hooks/use-guarded-read';

interface Options<T> {
  /** One read. `null` is a read that failed or answered nothing: it is ignored and the next tick tries again. */
  read: () => Promise<T | null>;
  onResult: (value: T) => void;
  /** Whether an answer ends the polling. */
  isTerminal: (value: T) => boolean;
  intervalMs: number;
  isEnabled?: boolean;
}

/**
 * Reads again on an interval until an answer says to stop.
 *
 * Built on `useGuardedRead` so a late answer cannot overwrite a newer one. A tick that finds the previous read
 * still in flight is skipped: starting a newer generation would make the slow answer stale every time.
 * Callbacks are read through refs, so fresh closures on every render do not restart the timer.
 */
export const usePolledRead = <T>({ read, onResult, isTerminal, intervalMs, isEnabled = true }: Options<T>): void => {
  const guarded = useGuardedRead();
  const readRef = useRef(read);
  const onResultRef = useRef(onResult);
  const isTerminalRef = useRef(isTerminal);

  readRef.current = read;
  onResultRef.current = onResult;
  isTerminalRef.current = isTerminal;

  useEffect(() => {
    if (!isEnabled) return;

    let isStopped = false;
    let isInFlight = false;

    const tick = async () => {
      if (isInFlight || isStopped) return;

      isInFlight = true;
      try {
        const answer = await guarded.run(readRef.current);

        if (isStopped || answer == null) return;

        onResultRef.current(answer);

        if (isTerminalRef.current(answer)) {
          isStopped = true;
          clearInterval(timer);
        }
      } finally {
        isInFlight = false;
      }
    };

    const timer = setInterval(() => void tick(), intervalMs);

    return () => {
      isStopped = true;
      clearInterval(timer);
      guarded.cancel();
    };
  }, [guarded, intervalMs, isEnabled]);
};
