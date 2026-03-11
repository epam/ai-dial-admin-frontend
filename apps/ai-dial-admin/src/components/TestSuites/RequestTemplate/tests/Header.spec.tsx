import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import Header from '../components/Header';

const mockDispatch = vi.fn();

vi.mock('@/src/context/SaveValidationContext', () => ({
  useSaveValidationContext: () => ({ dispatch: mockDispatch, isValid: true, errorFields: new Map() }),
  ValidationActionType: { SetField: 'SET_FIELD_VALIDATION', Reset: 'RESET' },
}));

vi.mock('../components/ContentTypeSelect', () => ({
  default: ({ testSuite, onChangeTestSuite }: any) => (
    <div role="region" aria-label="Content type select">
      <span>ContentTypeSelect</span>
      <button type="button" onClick={() => onChangeTestSuite(testSuite)}>
        ChangeContentType
      </button>
    </div>
  ),
}));

vi.mock('../components/TryOutButton', () => ({
  default: () => (
    <button type="button">{ButtonsI18nKey.TryOut}</button>
  ),
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialInput: ({ id, value, onChange, invalid, error }: any) => (
    <div>
      <input
        role="textbox"
        aria-label={id}
        value={value}
        onChange={(e: any) => onChange(e.target.value)}
        aria-invalid={invalid}
      />
      {error && <span role="alert">{error}</span>}
    </div>
  ),
}));

const createTestSuite = (overrides?: Partial<TestSuite>): TestSuite => ({
  id: 'suite-1',
  name: 'Test Suite',
  requestTemplate: { urlTemplate: '/api/test', body: { contentType: 'application/json', content: {} } },
  ...overrides,
});

describe('Header', () => {
  let mockOnChangeTestSuite: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnChangeTestSuite = vi.fn();
  });

  test('renders url template input with value from testSuite', () => {
    const testSuite = createTestSuite({
      requestTemplate: { urlTemplate: '/my/url', body: {} },
    });

    render(<Header testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);

    const input = screen.getByRole('textbox', { name: 'urlTemplate' });
    expect(input).toHaveValue('/my/url');
  });

  test('renders empty url template when requestTemplate.urlTemplate is undefined', () => {
    const testSuite = createTestSuite({
      requestTemplate: { body: {} },
    });

    render(<Header testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);

    const input = screen.getByRole('textbox', { name: 'urlTemplate' });
    expect(input).toHaveValue('');
  });

  test('renders endpoint method badge when endpointRef.method exists', () => {
    const testSuite = createTestSuite({ endpointRef: { method: 'POST' } });

    render(<Header testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);

    expect(screen.getByText('POST')).toBeInTheDocument();
  });

  test('does not render endpoint method badge when endpointRef is undefined', () => {
    render(<Header testSuite={createTestSuite()} onChangeTestSuite={mockOnChangeTestSuite} />);

    expect(screen.queryByText('GET')).not.toBeInTheDocument();
    expect(screen.queryByText('POST')).not.toBeInTheDocument();
  });

  test('does not render endpoint method badge when endpointRef.method is undefined', () => {
    const testSuite = createTestSuite({ endpointRef: {} });

    render(<Header testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);

    expect(screen.queryByText('GET')).not.toBeInTheDocument();
  });

  test('calls onChangeTestSuite with updated urlTemplate when input changes', () => {
    const testSuite = createTestSuite({
      requestTemplate: { urlTemplate: '/api', body: {} },
    });

    render(<Header testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'urlTemplate' }), {
      target: { value: '/api/v2/users' },
    });

    expect(mockOnChangeTestSuite).toHaveBeenCalledTimes(1);
    expect(mockOnChangeTestSuite).toHaveBeenCalledWith(
      expect.objectContaining({
        requestTemplate: expect.objectContaining({
          urlTemplate: '/api/v2/users',
        }),
      }),
    );
  });

  test('preserves other testSuite and requestTemplate fields when urlTemplate changes', () => {
    const testSuite = createTestSuite({
      name: 'My Suite',
      requestTemplate: {
        urlTemplate: '/api',
        body: { contentType: 'application/json', content: { x: 1 } },
        headers: [{ key: 'h', value: 'v' }],
      },
    });

    render(<Header testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'urlTemplate' }), {
      target: { value: '/new' },
    });

    const called = mockOnChangeTestSuite.mock.calls[0][0];
    expect(called.name).toBe('My Suite');
    expect(called.requestTemplate?.body).toEqual({ contentType: 'application/json', content: { x: 1 } });
    expect(called.requestTemplate?.headers).toEqual([{ key: 'h', value: 'v' }]);
  });

  test('renders ContentTypeSelect and TryOutButton', () => {
    render(<Header testSuite={createTestSuite()} onChangeTestSuite={mockOnChangeTestSuite} />);

    expect(screen.getByRole('region', { name: 'Content type select' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.TryOut })).toBeInTheDocument();
  });

  test('dispatches SetField validation for urlTemplate on mount with isValid true when no error', () => {
    render(<Header testSuite={createTestSuite()} onChangeTestSuite={mockOnChangeTestSuite} />);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_FIELD_VALIDATION',
      field: 'urlTemplate',
      isValid: true,
    });
  });

  test('dispatches invalid field when URL does not match relativeUrlPattern regex', () => {
    const testSuite = createTestSuite({
      requestTemplate: { urlTemplate: '/invalid' },
      endpointRef: { relativeUrlPattern: '/api/.*' },
    });

    render(<Header testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_FIELD_VALIDATION',
      field: 'urlTemplate',
      isValid: false,
    });
  });

  test('dispatches valid field when URL matches relativeUrlPattern regex', () => {
    const testSuite = createTestSuite({
      requestTemplate: { urlTemplate: '/api/users' },
      endpointRef: { relativeUrlPattern: '/api/.*' },
    });

    render(<Header testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_FIELD_VALIDATION',
      field: 'urlTemplate',
      isValid: true,
    });
  });

  test('shows error message when urlTemplate does not match relativeUrlPattern', () => {
    const testSuite = createTestSuite({
      requestTemplate: { urlTemplate: '/wrong' },
      endpointRef: { relativeUrlPattern: '/api/.*' },
    });

    render(<Header testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);

    expect(screen.getByRole('alert')).toHaveTextContent(/Not matches with \/api\/\.\*/);
  });

  test('does not show error when urlTemplate is empty and relativeUrlPattern is set', () => {
    const testSuite = createTestSuite({
      requestTemplate: { urlTemplate: '' },
      endpointRef: { relativeUrlPattern: '/api/.*' },
    });

    render(<Header testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('does not show error when relativeUrlPattern is undefined', () => {
    const testSuite = createTestSuite({
      requestTemplate: { urlTemplate: '/anything' },
      endpointRef: { relativeUrlPattern: undefined },
    });

    render(<Header testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('does not show error when relativeUrlPattern has no regex symbols', () => {
    const testSuite = createTestSuite({
      requestTemplate: { urlTemplate: '/something' },
      endpointRef: { relativeUrlPattern: '/other' },
    });

    render(<Header testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('passes testSuite and onChangeTestSuite to ContentTypeSelect', () => {
    const testSuite = createTestSuite({ name: 'Suite for Select' });

    render(<Header testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);

    fireEvent.click(screen.getByRole('button', { name: 'ChangeContentType' }));

    expect(mockOnChangeTestSuite).toHaveBeenCalledWith(testSuite);
  });
});
