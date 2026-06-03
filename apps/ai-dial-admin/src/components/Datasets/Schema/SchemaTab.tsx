'use client';

import { FC } from 'react';

import SchemaManager from '@/src/components/TestSuites/TestCaseSchema/SchemaManager';
import { Dataset } from '@/src/models/evaluation/dataset';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';

interface Props {
  dataset: Dataset;
  isSkipRefresh?: boolean;
  onChange: (dataset: Dataset, isSkipRefresh?: boolean) => void;
}

const DatasetSchemaTab: FC<Props> = ({ dataset, isSkipRefresh, onChange }) => {
  const onChangeSchema = (schema: TestCaseSchema[], skipRefresh?: boolean) => {
    onChange({ ...dataset, testCaseSchema: schema }, skipRefresh);
  };

  return (
    <SchemaManager
      testCaseSchema={dataset.testCaseSchema || []}
      onChangeTestCaseSchema={onChangeSchema}
      isSkipRefresh={isSkipRefresh}
    />
  );
};

export default DatasetSchemaTab;
