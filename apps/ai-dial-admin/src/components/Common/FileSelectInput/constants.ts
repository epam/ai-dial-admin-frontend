import { getDatasetFiles, removeDatasetFile, uploadDatasetFiles } from '@/src/app/[lang]/datasets/actions';
import { getTestSuiteFiles, removeTestSuiteFile, uploadTestSuiteFiles } from '@/src/app/[lang]/test-suites/actions';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityFileActions } from './models';

const TEST_SUITE_FILE_ACTIONS: EntityFileActions = {
  getFiles: getTestSuiteFiles,
  uploadFiles: uploadTestSuiteFiles,
  removeFile: removeTestSuiteFile,
};

const DATASET_FILE_ACTIONS: EntityFileActions = {
  getFiles: getDatasetFiles,
  uploadFiles: uploadDatasetFiles,
  removeFile: removeDatasetFile,
};

export const getEntityFileActions = (view?: ApplicationRoute): EntityFileActions =>
  view === ApplicationRoute.Datasets ? DATASET_FILE_ACTIONS : TEST_SUITE_FILE_ACTIONS;
