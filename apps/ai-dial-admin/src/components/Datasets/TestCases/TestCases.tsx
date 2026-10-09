'use client';

import { FC, RefObject } from 'react';

import { Dataset } from '@/src/models/evaluation/dataset';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';
import DatasetTestCasesList, { DatasetTestCasesActions } from './TestCasesList';

interface Props {
  dataset: Dataset;
  savedSchema?: TestCaseSchema[];
  testCasesActionsRef: RefObject<DatasetTestCasesActions | null>;
  onDirtyChange: (hasDirty: boolean) => void;
}

const DatasetTestCases: FC<Props> = ({ dataset, savedSchema, testCasesActionsRef, onDirtyChange }) => {
  return (
    <DatasetTestCasesList
      dataset={dataset}
      savedSchema={savedSchema}
      testCasesActionsRef={testCasesActionsRef}
      onDirtyChange={onDirtyChange}
    />
  );
};

export default DatasetTestCases;
