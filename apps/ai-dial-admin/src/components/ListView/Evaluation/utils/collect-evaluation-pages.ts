import { EvaluationPageData } from '@/src/models/request';

/**
 * Drains an offset-paged evaluation listing until every page is loaded.
 * Returns `null` when any page fetch fails (same contract as the per-page mappers).
 */
export const collectEvaluationPages = async <T>(
  fetchPage: (page: number) => Promise<EvaluationPageData<T> | null>,
): Promise<T[] | null> => {
  const items: T[] = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const mapped = await fetchPage(page);
    if (!mapped) {
      return null;
    }

    items.push(...mapped.content);
    totalPages = Math.max(mapped.totalPages, 1);
    if (mapped.content.length === 0) {
      break;
    }
    page += 1;
  }

  return items;
};
