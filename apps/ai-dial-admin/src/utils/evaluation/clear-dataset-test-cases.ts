import { getTestCases, removeMultipleTestCases } from '@/src/app/[lang]/datasets/actions';
import { ServerActionResponse } from '@/src/models/server-action';

const CLEAR_BATCH_SIZE = 50;

/**
 * Deletes every test case of a dataset, `CLEAR_BATCH_SIZE` at a time. There is no bulk-clear endpoint,
 * and names travel in the delete URL, so one request can't carry an unbounded list. Always reads page 0
 * because each deletion shifts the remaining cases forward; a batch that doesn't shrink the total
 * aborts the loop instead of spinning forever.
 */
export const clearDatasetTestCases = async (datasetId: string): Promise<ServerActionResponse> => {
  let previousTotal = Infinity;

  for (;;) {
    const page = await getTestCases(datasetId, 0, CLEAR_BATCH_SIZE, [], []);
    const names = (page?.content ?? [])
      .map((testCase) => testCase.testCaseName)
      .filter((name): name is string => !!name);

    if (!page || names.length === 0) {
      return { success: true };
    }
    if (page.totalElements >= previousTotal) {
      return { success: false, errorMessage: 'Test cases were not removed' };
    }
    previousTotal = page.totalElements;

    const res = await removeMultipleTestCases(datasetId, names);
    if (!res?.success) {
      return res;
    }
  }
};
