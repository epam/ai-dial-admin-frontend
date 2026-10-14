import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import DatasetSchemaTab from '@/src/components/Datasets/Schema/SchemaTab';
import { DatasetsI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { Dataset } from '@/src/models/evaluation/dataset';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { TestCaseItemType } from '@/src/types/evaluation';

vi.mock('@/src/components/TestSuites/TestCaseSchema/SchemaManager', () => ({
  default: ({ isReadOnly }: { isReadOnly?: boolean }) => (
    <div data-testid="schema-manager" data-read-only={String(!!isReadOnly)}>
      schema manager
    </div>
  ),
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

  test('shows no warning and an editable schema by default', () => {
    renderTab({ testCaseSchema: [field('prompt')] });

    expect(screen.queryByText(DatasetsI18nKey.SchemaReadOnlyTitle)).not.toBeInTheDocument();
    expect(screen.getByTestId('schema-manager')).toHaveAttribute('data-read-only', 'false');
  });

  test('shows the read-only warning and locks the schema when read-only', () => {
    render(<DatasetSchemaTab dataset={{ testCaseSchema: [field('prompt')] }} onChange={vi.fn()} isReadOnly />);

    expect(screen.getByText(DatasetsI18nKey.SchemaReadOnlyTitle)).toBeInTheDocument();
    expect(screen.getByText(DatasetsI18nKey.SchemaReadOnlyMessage)).toBeInTheDocument();
    expect(screen.getByTestId('schema-manager')).toHaveAttribute('data-read-only', 'true');
  });
});
