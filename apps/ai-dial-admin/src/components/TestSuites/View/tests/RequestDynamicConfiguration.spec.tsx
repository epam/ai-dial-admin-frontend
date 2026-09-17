import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, Mock, test, vi, beforeEach } from 'vitest';

import RequestDynamicConfiguration from '../RequestDynamicConfiguration';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { BasicI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';

vi.mock('@/src/components/Common/FileSelectInput/FileSelectInput', () => ({
  default: ({ value }: any) => <input aria-label="file-input" defaultValue={value} />,
}));

vi.mock('@/src/components/Common/JsonEditorInput/JsonEditorInput', () => ({
  default: ({ value }: any) => <input aria-label="json-input" defaultValue={JSON.stringify(value)} />,
}));

const createRequestView = (overrides?: Partial<TestSuite>): TestSuite => ({
  id: 'suite-1',
  name: 'Test Suite 1',
  inputBindings: [],
  ...overrides,
});

describe('RequestDynamicConfiguration', () => {
  let mockOnChangeRequestView: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnChangeRequestView = vi.fn();
  });

  test('renders the DynamicConfiguration accordion with the default title', () => {
    render(
      <RequestDynamicConfiguration requestView={createRequestView()} onChangeRequestView={mockOnChangeRequestView} />,
    );

    expect(screen.getByText(TestSuitesI18nKey.DynamicConfiguration)).toBeInTheDocument();
  });

  test('uses the given title when provided, for a request-chain-aware heading', () => {
    render(
      <RequestDynamicConfiguration
        requestView={createRequestView()}
        onChangeRequestView={mockOnChangeRequestView}
        title={`${TestSuitesI18nKey.DynamicConfiguration} — Second`}
      />,
    );

    expect(
      screen.getByRole('heading', { name: `${TestSuitesI18nKey.DynamicConfiguration} — Second` }),
    ).toBeInTheDocument();
  });

  test('renders a row for each placeholder found in the request template', () => {
    render(
      <RequestDynamicConfiguration
        requestView={createRequestView({ requestTemplate: { urlTemplate: '/api/${{question}}' } })}
        onChangeRequestView={mockOnChangeRequestView}
      />,
    );

    expect(screen.getByText('question')).toBeInTheDocument();
  });

  test('shows empty message when the request template has no placeholders', async () => {
    render(
      <RequestDynamicConfiguration
        requestView={createRequestView({ requestTemplate: { urlTemplate: '/api/static' } })}
        onChangeRequestView={mockOnChangeRequestView}
      />,
    );

    expect(screen.getByText(BasicI18nKey.NoVariables)).toBeInTheDocument();
  });

  test('renders Constant and Attribute type selector tabs', () => {
    render(
      <RequestDynamicConfiguration
        requestView={createRequestView({ requestTemplate: { urlTemplate: '/api/${{question}}' } })}
        onChangeRequestView={mockOnChangeRequestView}
      />,
    );

    expect(screen.getByText(TestSuitesI18nKey.Constant)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.Attribute)).toBeInTheDocument();
  });

  test('calls onChangeRequestView with updated inputBindings when a constant value changes', async () => {
    const user = userEvent.setup();
    render(
      <RequestDynamicConfiguration
        requestView={createRequestView({
          requestTemplate: { urlTemplate: '/api/${{question}}' },
          inputBindings: [{ templateVariable: 'question', constantValue: 'old' }],
        })}
        onChangeRequestView={mockOnChangeRequestView}
      />,
    );

    const input = screen.getByDisplayValue('old');
    await user.clear(input);
    await user.type(input, 'new');

    expect(mockOnChangeRequestView).toHaveBeenLastCalledWith(
      expect.objectContaining({
        inputBindings: expect.arrayContaining([
          expect.objectContaining({ templateVariable: 'question', constantValue: expect.any(String) }),
        ]),
      }),
      true,
    );
  });

  test('uses an empty array as fallback for undefined inputBindings', () => {
    render(
      <RequestDynamicConfiguration
        requestView={createRequestView({
          requestTemplate: { urlTemplate: '/api/${{question}}' },
          inputBindings: undefined,
        })}
        onChangeRequestView={mockOnChangeRequestView}
      />,
    );

    expect(screen.getByText('question')).toBeInTheDocument();
  });
});
