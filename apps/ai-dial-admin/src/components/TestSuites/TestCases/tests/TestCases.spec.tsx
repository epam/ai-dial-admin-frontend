import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach, Mock } from 'vitest';

import TestCases from '../TestCases';
import { TestSuite } from '@/src/models/evaluation/test-suite';

vi.mock('../TemplateVariables', () => ({
  default: ({ selectedTestSuite, onChange, isSkipRefresh }: any) => (
    <div data-testid="template-variables">
      <div data-testid="tv-suite-id">{selectedTestSuite.id}</div>
      <div data-testid="tv-skip-refresh">{String(isSkipRefresh)}</div>
      <button data-testid="tv-change" onClick={() => onChange({ ...selectedTestSuite, name: 'Changed by TV' }, true)}>
        TV Change
      </button>
    </div>
  ),
}));

vi.mock('../TestCasesList', () => ({
  default: ({ selectedTestSuite, onChange }: any) => (
    <div data-testid="test-cases-list">
      <div data-testid="tcl-suite-id">{selectedTestSuite.id}</div>
      <button data-testid="tcl-change" onClick={() => onChange({ ...selectedTestSuite, name: 'Changed by TCL' })}>
        TCL Change
      </button>
    </div>
  ),
}));

const createTestSuite = (overrides?: Partial<TestSuite>): TestSuite => ({
  id: 'suite-1',
  name: 'Test Suite 1',
  inputBindings: [],
  testCaseSchema: [],
  ...overrides,
});

describe('TestCases', () => {
  let mockOnChange: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnChange = vi.fn();
  });

  test('renders both TemplateVariables and TestCasesList', () => {
    render(<TestCases selectedTestSuite={createTestSuite()} onChange={mockOnChange} />);

    expect(screen.getByTestId('template-variables')).toBeInTheDocument();
    expect(screen.getByTestId('test-cases-list')).toBeInTheDocument();
  });

  test('passes selectedTestSuite to TemplateVariables', () => {
    render(<TestCases selectedTestSuite={createTestSuite({ id: 'my-suite' })} onChange={mockOnChange} />);

    expect(screen.getByTestId('tv-suite-id')).toHaveTextContent('my-suite');
  });

  test('passes selectedTestSuite to TestCasesList', () => {
    render(<TestCases selectedTestSuite={createTestSuite({ id: 'my-suite' })} onChange={mockOnChange} />);

    expect(screen.getByTestId('tcl-suite-id')).toHaveTextContent('my-suite');
  });

  test('passes isSkipRefresh to TemplateVariables', () => {
    render(<TestCases selectedTestSuite={createTestSuite()} onChange={mockOnChange} isSkipRefresh={true} />);

    expect(screen.getByTestId('tv-skip-refresh')).toHaveTextContent('true');
  });

  test('defaults isSkipRefresh to undefined', () => {
    render(<TestCases selectedTestSuite={createTestSuite()} onChange={mockOnChange} />);

    expect(screen.getByTestId('tv-skip-refresh')).toHaveTextContent('undefined');
  });

  test('passes onChange to TemplateVariables and it triggers correctly', () => {
    render(<TestCases selectedTestSuite={createTestSuite()} onChange={mockOnChange} />);

    fireEvent.click(screen.getByTestId('tv-change'));

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ name: 'Changed by TV' }), true);
  });

  test('passes onChange to TestCasesList and it triggers correctly', () => {
    render(<TestCases selectedTestSuite={createTestSuite()} onChange={mockOnChange} />);

    fireEvent.click(screen.getByTestId('tcl-change'));

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ name: 'Changed by TCL' }));
  });

  test('renders with correct container classes', () => {
    const { container } = render(<TestCases selectedTestSuite={createTestSuite()} onChange={mockOnChange} />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex-1', 'min-h-0', 'flex', 'flex-col', 'gap-y-6');
  });
});
