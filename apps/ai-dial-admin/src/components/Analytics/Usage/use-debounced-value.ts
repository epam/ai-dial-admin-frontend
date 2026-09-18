'use client';

import { useEffect, useState } from 'react';

/**
 * Holds a value back until it stops changing. The breakdown search is a live field and every term it
 * reports re-issues the tab query, so the request follows the typing rather than each keystroke.
 */
export const useDebouncedValue = <T>(value: T, delayMs: number): T => {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return settled;
};
