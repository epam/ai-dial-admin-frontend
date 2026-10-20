import { TOTAL_COUNT_HEADER } from '@/src/constants/api-headers';

/**
 * The `X-Total-Count` a response carries, or `undefined` when it carries none or one that is not a count —
 * a `NaN` would read as "a total was reported" to every `!= null` check downstream.
 */
export const getTotalCount = (res: Response): number | undefined => {
  const header = res.headers.get(TOTAL_COUNT_HEADER);
  const totalCount = header == null || header.trim() === '' ? NaN : Number(header);

  return Number.isFinite(totalCount) ? totalCount : undefined;
};
