import { getDatasetFiles, removeDatasetFile, uploadDatasetFiles } from '@/src/app/[lang]/datasets/actions';
import { getTestSuiteFiles, removeTestSuiteFile, uploadTestSuiteFiles } from '@/src/app/[lang]/test-suites/actions';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityFileActions } from './models';

// Built on call, not at module load: reading the imported actions eagerly breaks every spec whose
// `vi.mock` factory for these action modules omits the file actions.
export const getEntityFileActions = (view?: ApplicationRoute): EntityFileActions =>
  view === ApplicationRoute.Datasets
    ? { getFiles: getDatasetFiles, uploadFiles: uploadDatasetFiles, removeFile: removeDatasetFile }
    : { getFiles: getTestSuiteFiles, uploadFiles: uploadTestSuiteFiles, removeFile: removeTestSuiteFile };
