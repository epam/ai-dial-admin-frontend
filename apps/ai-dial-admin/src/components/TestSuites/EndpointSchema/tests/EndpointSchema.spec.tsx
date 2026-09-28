import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { ValidationActionType } from '@/src/context/SaveValidationContext';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import EndpointSchema from '../EndpointSchema';

const mockDispatch = vi.fn();

vi.mock('@/src/context/SaveValidationContext', () => ({
  useSaveValidationContext: () => ({ isValid: true, dispatch: mockDispatch }),
  ValidationActionType: {
    SetField: 'SET_FIELD_VALIDATION',
    RemoveField: 'REMOVE_FIELD_VALIDATION',
  },
}));

vi.mock('../Columns/Columns', () => ({
  default: ({ duplicateColumn }: { duplicateColumn?: { name: string; inPreviousRequest: boolean } }) => (
    <div>
      Columns
      {duplicateColumn && (
        <div>
          {duplicateColumn.inPreviousRequest
            ? TestSuitesI18nKey.DuplicateResponseColumnNameInPreviousRequest
            : TestSuitesI18nKey.DuplicateResponseColumnName}
        </div>
      )}
    </div>
  ),
}));

const configuredSuite: TestSuite = {
  id: 'suite-1',
  endpointRef: { method: 'POST', relativeUrlPattern: '/v1/chat' },
};

const suiteWithDuplicateAnswer: TestSuite = {
  ...configuredSuite,
  responseColumns: [{ name: 'answer', displayName: 'answer', expression: 'a', type: 'string' }],
};

describe('EndpointSchema', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
  });

  test('renders the "Extracted response fields" title and the Columns view, with no method-picker guidance', () => {
    render(<EndpointSchema testSuite={{ id: 'suite-1' }} onChangeTestSuite={vi.fn()} />);

    expect(screen.getByRole('heading', { name: TestSuitesI18nKey.EndpointSchema })).toBeInTheDocument();
    expect(screen.getByText('Columns')).toBeInTheDocument();
    expect(screen.queryByText(TestSuitesI18nKey.ConfigureEndpointFirst)).not.toBeInTheDocument();
  });

  test('renders the Columns view when the endpoint is configured', () => {
    render(<EndpointSchema testSuite={configuredSuite} onChangeTestSuite={vi.fn()} />);

    expect(screen.getByText('Columns')).toBeInTheDocument();
  });

  test('flags column-name-uniqueness validation and passes the duplicate down to Columns', () => {
    render(
      <EndpointSchema testSuite={suiteWithDuplicateAnswer} onChangeTestSuite={vi.fn()} takenColumnNames={['answer']} />,
    );

    expect(mockDispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'columnUniqueness',
      isValid: false,
    });
    expect(screen.getByText(TestSuitesI18nKey.DuplicateResponseColumnNameInPreviousRequest)).toBeInTheDocument();
  });

  test('marks column-name uniqueness valid when column names are unique', () => {
    render(
      <EndpointSchema
        testSuite={suiteWithDuplicateAnswer}
        onChangeTestSuite={vi.fn()}
        takenColumnNames={['history']}
      />,
    );

    expect(mockDispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'columnUniqueness',
      isValid: true,
    });
  });

  test('removes the columnUniqueness field on unmount', () => {
    const { unmount } = render(
      <EndpointSchema testSuite={configuredSuite} onChangeTestSuite={vi.fn()} takenColumnNames={[]} />,
    );

    mockDispatch.mockClear();
    unmount();

    expect(mockDispatch).toHaveBeenCalledWith({
      type: ValidationActionType.RemoveField,
      field: 'columnUniqueness',
    });
  });
});
