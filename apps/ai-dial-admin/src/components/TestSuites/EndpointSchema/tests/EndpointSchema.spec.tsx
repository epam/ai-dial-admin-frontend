import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { BasicI18nKey, TabsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
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

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();

  return {
    ...actual,
    DialTabs: ({
      tabs,
      onClick,
    }: {
      tabs: Array<{ id: string; label: ReactNode; invalid?: boolean }>;
      onClick: (id: string) => void;
    }) => (
      <div role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-invalid={tab.invalid ? 'true' : undefined}
            onClick={() => onClick(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    ),
  };
});

vi.mock('@/src/components/Common/SchemaGrid/SchemaGrid', () => ({
  default: () => <button type="button">Basic.AddField</button>,
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

vi.mock('@/src/components/EntityTabs/JsonEditor/JsonEditor', () => ({
  default: () => <div>JSON editor</div>,
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

  test('shows Change method guidance and hides Add Field when the endpoint is not configured', () => {
    render(<EndpointSchema testSuite={{ id: 'suite-1' }} onChangeTestSuite={vi.fn()} />);

    expect(screen.getByText(TestSuitesI18nKey.ConfigureEndpointFirst)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.ConfigureEndpointFirstDescription)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: BasicI18nKey.AddField })).not.toBeInTheDocument();
  });

  test('renders the schema grid when the endpoint is configured', () => {
    render(<EndpointSchema testSuite={configuredSuite} onChangeTestSuite={vi.fn()} />);

    expect(screen.getByRole('button', { name: BasicI18nKey.AddField })).toBeInTheDocument();
    expect(screen.queryByText(TestSuitesI18nKey.ConfigureEndpointFirst)).not.toBeInTheDocument();
  });

  test('marks the Columns tab invalid and blocks save when a column name is taken', async () => {
    const user = userEvent.setup();

    render(
      <EndpointSchema testSuite={suiteWithDuplicateAnswer} onChangeTestSuite={vi.fn()} takenColumnNames={['answer']} />,
    );

    expect(mockDispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'columnUniqueness',
      isValid: false,
    });

    const columnsTab = screen.getByRole('tab', { name: TabsI18nKey.Columns });
    expect(columnsTab).toHaveAttribute('aria-invalid', 'true');

    await user.click(columnsTab);

    expect(screen.getByText(TestSuitesI18nKey.DuplicateResponseColumnNameInPreviousRequest)).toBeInTheDocument();
  });

  test('marks the Columns tab valid when column names are unique', () => {
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
    expect(screen.getByRole('tab', { name: TabsI18nKey.Columns })).not.toHaveAttribute('aria-invalid');
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
