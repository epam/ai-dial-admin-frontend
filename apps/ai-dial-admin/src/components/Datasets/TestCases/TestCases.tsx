'use client';

import { FC, RefObject } from 'react';

import { Dataset } from '@/src/models/evaluation/dataset';
import DatasetTestCasesList, { DatasetTestCasesActions } from './TestCasesList';

interface Props {
  dataset: Dataset;
  testCasesActionsRef: RefObject<DatasetTestCasesActions | null>;
  onDirtyChange: (hasDirty: boolean) => void;
}

const DatasetTestCases: FC<Props> = ({ dataset, testCasesActionsRef, onDirtyChange }) => {
  return (
    <DatasetTestCasesList dataset={dataset} testCasesActionsRef={testCasesActionsRef} onDirtyChange={onDirtyChange} />
  );
};

export default DatasetTestCases;
