import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach, Mock } from 'vitest';

import TestCases from '../TestCases';
import { TestSuite } from '@/src/models/evaluation/test-suite';

vi.mock('../TemplateVariables', () => ({
  default: ({ selectedTestSuite, onChange, isSkipRefresh }: any) => (
    <section aria-label="template variables">
      <span>{selectedTestSuite.id}</span>
      <span role="note">{String(isSkipRefresh)}</span>
      <button onClick={() => onChange({ ...selectedTestSuite, name: 'Changed by TV' }, true)}>TV Change</button>
    </section>
  ),
}));

vi.mock('../TestCasesList', () => ({
  default: ({ selectedTestSuite, onChange }: any) => (
    <section aria-label="test cases list">
      <span>{selectedTestSuite.id}</span>
      <button onClick={() => onChange({ ...selectedTestSuite, name: 'Changed by TCL' })}>TCL Change</button>
    </section>
  ),
}));

const createTestSuite = (overrides?: Partial<TestSuite>): TestSuite => ({
  id: 'suite-1',
  name: 'Test Suite 1',
  inputBindings: [],
  ...overrides,
});

describe('TestCases', () => {
  let mockOnChange: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnChange = vi.fn();
  });

  const defaultDatasetProps = { dataset: null, suiteEtag: '' };

  test('renders both TemplateVariables and TestCasesList', () => {
    render(<TestCases selectedTestSuite={createTestSuite()} onChange={mockOnChange} {...defaultDatasetProps} />);

    expect(screen.getByRole('region', { name: 'template variables' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'test cases list' })).toBeInTheDocument();
  });

  test('passes selectedTestSuite to TemplateVariables', () => {
    render(
      <TestCases
        selectedTestSuite={createTestSuite({ id: 'my-suite' })}
        onChange={mockOnChange}
        {...defaultDatasetProps}
      />,
    );

    const tvSection = screen.getByRole('region', { name: 'template variables' });
    expect(tvSection).toHaveTextContent('my-suite');
  });

  test('passes selectedTestSuite to TestCasesList', () => {
    render(
      <TestCases
        selectedTestSuite={createTestSuite({ id: 'my-suite' })}
        onChange={mockOnChange}
        {...defaultDatasetProps}
      />,
    );

    const tclSection = screen.getByRole('region', { name: 'test cases list' });
    expect(tclSection).toHaveTextContent('my-suite');
  });

  test('passes isSkipRefresh to TemplateVariables', () => {
    render(
      <TestCases
        selectedTestSuite={createTestSuite()}
        onChange={mockOnChange}
        isSkipRefresh={true}
        {...defaultDatasetProps}
      />,
    );

    expect(screen.getByRole('note')).toHaveTextContent('true');
  });

  test('defaults isSkipRefresh to undefined', () => {
    render(<TestCases selectedTestSuite={createTestSuite()} onChange={mockOnChange} {...defaultDatasetProps} />);

    expect(screen.getByRole('note')).toHaveTextContent('undefined');
  });

  test('passes onChange to TemplateVariables and it triggers correctly', () => {
    render(<TestCases selectedTestSuite={createTestSuite()} onChange={mockOnChange} {...defaultDatasetProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'TV Change' }));

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ name: 'Changed by TV' }), true);
  });

  test('passes onChange to TestCasesList and it triggers correctly', () => {
    render(<TestCases selectedTestSuite={createTestSuite()} onChange={mockOnChange} {...defaultDatasetProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'TCL Change' }));

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ name: 'Changed by TCL' }));
  });

  test('renders with correct container classes', () => {
    const { container } = render(
      <TestCases selectedTestSuite={createTestSuite()} onChange={mockOnChange} {...defaultDatasetProps} />,
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('h-full', 'flex', 'flex-col', 'gap-y-6');
  });
});
