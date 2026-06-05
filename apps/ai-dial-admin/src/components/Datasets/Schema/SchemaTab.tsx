'use client';

import { FC, useEffect } from 'react';

import SchemaManager from '@/src/components/TestSuites/TestCaseSchema/SchemaManager';
import { Dataset } from '@/src/models/evaluation/dataset';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';

interface Props {
  dataset: Dataset;
  isSkipRefresh?: boolean;
  onChange: (dataset: Dataset, isSkipRefresh?: boolean) => void;
}

const DatasetSchemaTab: FC<Props> = ({ dataset, isSkipRefresh, onChange }) => {
  const { dispatch } = useSaveValidationContext();

  const onChangeSchema = (schema: TestCaseSchema[], skipRefresh?: boolean) => {
    onChange({ ...dataset, testCaseSchema: schema }, skipRefresh);
  };

  useEffect(() => {
    dispatch({
      type: ValidationActionType.SetField,
      field: 'testCaseSchema',
      isValid: !dataset.testCaseSchema?.some((item) => !item.name || !item.type),
    });
  }, [dataset.testCaseSchema, dispatch]);

  return (
    <SchemaManager
      testCaseSchema={dataset.testCaseSchema || []}
      onChangeTestCaseSchema={onChangeSchema}
      isSkipRefresh={isSkipRefresh}
    />
  );
};

export default DatasetSchemaTab;
