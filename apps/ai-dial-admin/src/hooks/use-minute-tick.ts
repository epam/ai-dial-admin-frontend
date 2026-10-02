import { useEffect, useState } from 'react';

/** The resolution the ages are stated at, and therefore how often they can change. */
const MINUTE_TICK_MS = 60_000;

/**
 * A clock for relative times, re-read once a minute.
 *
 * Once a minute rather than once a second because `formatRelativeTime`'s smallest unit is the minute: a
 * 1 Hz tick re-renders its consumer sixty times for every string it could change.
 *
 * `isRunning` lets a component that currently shows no age keep its hooks in order without paying for a
 * timer — a card that renders nothing still runs its effects.
 */
export const useMinuteTick = (isRunning = true): number => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isRunning) return;

    // Read once on resume, not only on the first tick. A consumer that was idle for an hour holds a
    // clock an hour old, and `formatRelativeTime` clamps a negative age to "just now" — so an hour-old
    // failure would announce itself as having happened this second until the first interval fired.
    setNow(Date.now());

    const timer = setInterval(() => setNow(Date.now()), MINUTE_TICK_MS);

    return () => clearInterval(timer);
  }, [isRunning]);

  return now;
};
