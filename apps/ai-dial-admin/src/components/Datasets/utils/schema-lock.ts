import { getDatasetTestSuitesPage } from '@/src/app/[lang]/datasets/actions';
import { Dataset, DatasetVisibility } from '@/src/models/evaluation/dataset';
import { errorObjLog } from '@/src/server/logger';

/**
 * A PUBLIC dataset bound to at least one test suite cannot have its fields renamed, so its schema is
 * shown read-only. A PRIVATE dataset is never locked and skips the lookup. A failed lookup leaves the
 * schema editable: the backend's 409 is the authority, and locking on an outage would lock every dataset.
 */
export const getIsSchemaReadOnly = async (dataset: Dataset): Promise<boolean> => {
  if (dataset.visibility !== DatasetVisibility.PUBLIC || !dataset.id) {
    return false;
  }

  try {
    const boundSuites = await getDatasetTestSuitesPage(dataset.id, 0, 1, [], []);
    return (boundSuites?.content.length ?? 0) > 0;
  } catch (e) {
    errorObjLog(e, 'Failed to check test suites bound to dataset');
    return false;
  }
};
