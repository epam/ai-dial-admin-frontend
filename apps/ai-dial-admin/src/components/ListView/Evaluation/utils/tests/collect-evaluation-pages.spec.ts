import { describe, expect, test, vi } from 'vitest';

import { EvaluationPageData } from '@/src/models/request';

import { collectEvaluationPages } from '../collect-evaluation-pages';

const page = <T>(content: T[], pageIndex: number, totalPages: number): EvaluationPageData<T> => ({
  page: pageIndex,
  size: content.length,
  totalElements: totalPages * content.length,
  totalPages,
  content,
});

describe('collectEvaluationPages', () => {
  test('returns a single page of results', async () => {
    const fetchPage = vi.fn().mockResolvedValue(page(['a', 'b'], 0, 1));

    await expect(collectEvaluationPages(fetchPage)).resolves.toEqual(['a', 'b']);
    expect(fetchPage).toHaveBeenCalledExactlyOnceWith(0);
  });

  test('walks every page and concatenates content', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce(page(['a'], 0, 3))
      .mockResolvedValueOnce(page(['b'], 1, 3))
      .mockResolvedValueOnce(page(['c'], 2, 3));

    await expect(collectEvaluationPages(fetchPage)).resolves.toEqual(['a', 'b', 'c']);
    expect(fetchPage).toHaveBeenCalledTimes(3);
  });

  test('returns null when any page fetch fails', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce(page(['a'], 0, 2))
      .mockResolvedValueOnce(null);

    await expect(collectEvaluationPages(fetchPage)).resolves.toBeNull();
  });

  test('stops when a page returns no content', async () => {
    const fetchPage = vi.fn().mockResolvedValue(page([], 0, 5));

    await expect(collectEvaluationPages(fetchPage)).resolves.toEqual([]);
    expect(fetchPage).toHaveBeenCalledExactlyOnceWith(0);
  });
});
