import { useEffect, useState } from 'react';

import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';

/**
 * Returns a locale-formatted datetime string after client mount to avoid SSR hydration mismatches.
 * Server and initial client render return '' so text content matches during hydration.
 */
export const useLocalDateTimeString = (value?: number | string): string => {
  const [formatted, setFormatted] = useState('');

  useEffect(() => {
    setFormatted(formatDateTimeToLocalString(value));
  }, [value]);

  return formatted;
};
