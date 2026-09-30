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

let capturedColumnsProps: { responseColumns: unknown; responseSchema: unknown } | undefined;

vi.mock('../Columns/Columns', () => ({
  default: ({
    duplicateColumn,
    responseColumns,
    responseSchema,
  }: {
    duplicateColumn?: { name: string; inPreviousRequest: boolean };
    responseColumns: unknown;
    responseSchema: unknown;
  }) => {
    capturedColumnsProps = { responseColumns, responseSchema };
    return (
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
    );
  },
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
    capturedColumnsProps = undefined;
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

  test('passes Columns the same empty responseColumns/responseSchema reference across re-renders for a request with neither yet', () => {
    // A brand-new request has no `responseColumns`/`endpointRef.responseBodySchema` yet. Regression for
    // a bug where `testSuite.responseColumns || []` (and the schema equivalent) handed Columns a new
    // array/object every render, which fed its memoized grid props a "changed" dependency on every
    // render and looped back into a re-render via SaveValidationContext ("Maximum update depth exceeded").
    const { rerender } = render(<EndpointSchema testSuite={{ id: 'suite-1' }} onChangeTestSuite={vi.fn()} />);
    const firstRenderProps = capturedColumnsProps;

    rerender(<EndpointSchema testSuite={{ id: 'suite-1' }} onChangeTestSuite={vi.fn()} takenColumnNames={[]} />);

    expect(capturedColumnsProps?.responseColumns).toBe(firstRenderProps?.responseColumns);
    expect(capturedColumnsProps?.responseSchema).toBe(firstRenderProps?.responseSchema);
  });
});
