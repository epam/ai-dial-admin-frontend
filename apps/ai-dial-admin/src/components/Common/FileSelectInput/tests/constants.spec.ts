import { describe, expect, test, vi } from 'vitest';

import { getDatasetFiles, removeDatasetFile, uploadDatasetFiles } from '@/src/app/[lang]/datasets/actions';
import { getTestSuiteFiles, removeTestSuiteFile, uploadTestSuiteFiles } from '@/src/app/[lang]/test-suites/actions';
import { getEntityFileActions } from '@/src/components/Common/FileSelectInput/constants';
import { ApplicationRoute } from '@/src/types/routes';

vi.mock('@/src/app/[lang]/datasets/actions');
vi.mock('@/src/app/[lang]/test-suites/actions');

describe('FileSelectInput :: getEntityFileActions', () => {
  test('Should return dataset file actions for datasets view', () => {
    expect(getEntityFileActions(ApplicationRoute.Datasets)).toEqual({
      getFiles: getDatasetFiles,
      uploadFiles: uploadDatasetFiles,
      removeFile: removeDatasetFile,
    });
  });

  test.each([ApplicationRoute.TestSuites, undefined])('Should return test suite file actions for %s view', (view) => {
    expect(getEntityFileActions(view)).toEqual({
      getFiles: getTestSuiteFiles,
      uploadFiles: uploadTestSuiteFiles,
      removeFile: removeTestSuiteFile,
    });
  });
});
