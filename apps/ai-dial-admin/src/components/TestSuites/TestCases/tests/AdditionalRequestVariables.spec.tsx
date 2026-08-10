import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import AdditionalRequestVariables from '../AdditionalRequestVariables';
import { TestSuite, TestSuiteAdditionalRequest } from '@/src/models/evaluation/test-suite';
import { TestSuitesI18nKey } from '@/src/constants/i18n';

vi.mock('@/src/components/Common/FileSelectInput/FileSelectInput', () => ({
  default: ({ value }: any) => <input aria-label="file-input" defaultValue={value} />,
}));

vi.mock('@/src/components/Common/JsonEditorInput/JsonEditorInput', () => ({
  default: ({ value }: any) => <input aria-label="json-input" defaultValue={JSON.stringify(value)} />,
}));

const createRequest = (overrides?: Partial<TestSuiteAdditionalRequest>): TestSuiteAdditionalRequest => ({
  ...overrides,
});

const createTestSuite = (
  additionalRequests: TestSuiteAdditionalRequest[],
  overrides?: Partial<TestSuite>,
): TestSuite => ({
  id: 'suite-1',
  name: 'Test Suite 1',
  inputBindings: [],
  additionalRequests,
  ...overrides,
});

describe('AdditionalRequestVariables', () => {
  let mockOnChange: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnChange = vi.fn();
  });

  test('renders derived variables from the request template', () => {
    const testSuite = createTestSuite([
      createRequest({ requestTemplate: { urlTemplate: '/api/${{followUpQuestion}}' } }),
    ]);

    render(<AdditionalRequestVariables selectedTestSuite={testSuite} requestIndex={1} onChange={mockOnChange} />);

    expect(screen.getByText('followUpQuestion')).toBeInTheDocument();
  });

  test('shows empty message when the request template has no placeholders', () => {
    const testSuite = createTestSuite([createRequest({ requestTemplate: { urlTemplate: '/api/static' } })]);

    render(<AdditionalRequestVariables selectedTestSuite={testSuite} requestIndex={1} onChange={mockOnChange} />);

    expect(screen.getByRole('heading')).toHaveTextContent(TestSuitesI18nKey.DynamicConfiguration);
  });

  test('combines the DynamicConfiguration label with the request name as section title when set', () => {
    const testSuite = createTestSuite([createRequest({ name: 'Follow-up call' })]);

    render(<AdditionalRequestVariables selectedTestSuite={testSuite} requestIndex={1} onChange={mockOnChange} />);

    expect(
      screen.getByRole('heading', { name: `${TestSuitesI18nKey.DynamicConfiguration} — Follow-up call` }),
    ).toBeInTheDocument();
  });

  test('falls back to a numbered request title when the request has no name', () => {
    const testSuite = createTestSuite([createRequest()]);

    render(<AdditionalRequestVariables selectedTestSuite={testSuite} requestIndex={1} onChange={mockOnChange} />);

    expect(
      screen.getByRole('heading', {
        name: `${TestSuitesI18nKey.DynamicConfiguration} — 2. ${TestSuitesI18nKey.Request}`,
      }),
    ).toBeInTheDocument();
  });

  test('falls back to a numbered request title when the request name is an empty string', () => {
    const testSuite = createTestSuite([createRequest({ name: '' })]);

    render(<AdditionalRequestVariables selectedTestSuite={testSuite} requestIndex={1} onChange={mockOnChange} />);

    expect(
      screen.getByRole('heading', {
        name: `${TestSuitesI18nKey.DynamicConfiguration} — 2. ${TestSuitesI18nKey.Request}`,
      }),
    ).toBeInTheDocument();
  });

  test('merges derived variables with the request own inputBindings', () => {
    const testSuite = createTestSuite([
      createRequest({
        requestTemplate: { urlTemplate: '/api/${{followUpQuestion}}' },
        inputBindings: [{ templateVariable: 'followUpQuestion', constantValue: 'existing-value' }],
      }),
    ]);

    render(<AdditionalRequestVariables selectedTestSuite={testSuite} requestIndex={1} onChange={mockOnChange} />);

    expect(screen.getByDisplayValue('existing-value')).toBeInTheDocument();
  });

  test('write-back updates only the matching additionalRequests entry, not suite-level inputBindings', async () => {
    const user = userEvent.setup();
    const testSuite = createTestSuite([
      createRequest({
        requestTemplate: { urlTemplate: '/api/${{followUpQuestion}}' },
        inputBindings: [{ templateVariable: 'followUpQuestion', constantValue: 'old' }],
      }),
      createRequest({ requestTemplate: { urlTemplate: '/api/${{unrelated}}' } }),
    ]);

    render(<AdditionalRequestVariables selectedTestSuite={testSuite} requestIndex={1} onChange={mockOnChange} />);

    const input = screen.getByDisplayValue('old');
    await user.clear(input);
    await user.type(input, 'new');

    expect(mockOnChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        inputBindings: testSuite.inputBindings,
        additionalRequests: [
          expect.objectContaining({
            inputBindings: expect.arrayContaining([
              expect.objectContaining({ templateVariable: 'followUpQuestion', constantValue: expect.any(String) }),
            ]),
          }),
          testSuite.additionalRequests?.[1],
        ],
      }),
      true,
    );
  });

  test('operates on the correct additionalRequests entry for requestIndex > 1', async () => {
    const testSuite = createTestSuite([
      createRequest({ requestTemplate: { urlTemplate: '/api/${{first}}' } }),
      createRequest({ requestTemplate: { urlTemplate: '/api/${{second}}' } }),
    ]);

    render(<AdditionalRequestVariables selectedTestSuite={testSuite} requestIndex={2} onChange={mockOnChange} />);

    expect(screen.getByText('second')).toBeInTheDocument();
    expect(screen.queryByText('first')).not.toBeInTheDocument();
  });

  test('shows Constant and Attribute type selector tabs', () => {
    const testSuite = createTestSuite([
      createRequest({ requestTemplate: { urlTemplate: '/api/${{followUpQuestion}}' } }),
    ]);

    render(<AdditionalRequestVariables selectedTestSuite={testSuite} requestIndex={1} onChange={mockOnChange} />);

    expect(screen.getByText(TestSuitesI18nKey.Constant)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.Attribute)).toBeInTheDocument();
  });
});
