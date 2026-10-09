import { render } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import DatasetSchemaTab from '@/src/components/Datasets/Schema/SchemaTab';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { Dataset } from '@/src/models/evaluation/dataset';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { TestCaseItemType } from '@/src/types/evaluation';

vi.mock('@/src/components/TestSuites/TestCaseSchema/SchemaManager', () => ({
  default: () => <div>schema manager</div>,
}));

const field = (name: string): TestCaseSchema => ({
  name,
  type: TestCaseItemType.STRING,
  required: false,
  description: '',
});

describe('DatasetSchemaTab', () => {
  const { dispatch } = useSaveValidationContext();

  const renderTab = (dataset: Dataset) => render(<DatasetSchemaTab dataset={dataset} onChange={vi.fn()} />);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('reports the schema valid when names are unique', () => {
    renderTab({ testCaseSchema: [field('prompt'), field('answer')] });

    expect(dispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'testCaseSchema',
      isValid: true,
    });
  });

  test('reports the schema invalid when names differ only in case', () => {
    renderTab({ testCaseSchema: [field('prompt'), field('Prompt')] });

    expect(dispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'testCaseSchema',
      isValid: false,
    });
  });

  test('reports the schema invalid when a name is empty', () => {
    renderTab({ testCaseSchema: [field('')] });

    expect(dispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'testCaseSchema',
      isValid: false,
    });
  });
});
