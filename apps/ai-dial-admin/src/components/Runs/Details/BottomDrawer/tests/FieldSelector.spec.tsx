import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook, act } from '@testing-library/react';

import { ComparisonSection } from '../models';
import { useFieldSelector } from '../useFieldSelector';

import FieldSelector from '../FieldSelector';

const mockSections: ComparisonSection[] = [
  {
    key: 'execution',
    label: 'Execution',
    rows: [
      { fieldKey: 'status', label: 'status', isNumeric: false, values: [{ raw: 'SUCCESS' }] },
      { fieldKey: 'duration', label: 'duration', isNumeric: true, values: [{ raw: '1000' }] },
    ],
  },
  {
    key: 'testCaseData',
    label: 'Test Case Data',
    rows: [{ fieldKey: 'input', label: 'input', isNumeric: false, values: [{ raw: 'hello' }] }],
  },
];

function renderWithHook() {
  const hookResult = { current: null as ReturnType<typeof useFieldSelector> | null };

  function Wrapper() {
    const fs = useFieldSelector(mockSections);
    hookResult.current = fs;
    return <FieldSelector sections={mockSections} fieldSelector={fs} />;
  }

  const result = render(<Wrapper />);
  return { ...result, fieldSelector: hookResult };
}

describe('FieldSelector', () => {
  it('renders Fields tab by default', () => {
    renderWithHook();
    expect(screen.getByText('Runs.Fields')).toBeInTheDocument();
    expect(screen.getByText('Runs.Execution')).toBeInTheDocument();
  });

  it('shows all section names', () => {
    renderWithHook();
    expect(screen.getByText('Runs.Execution')).toBeInTheDocument();
    expect(screen.getByText('Runs.TestCaseData')).toBeInTheDocument();
  });

  it('shows field names', () => {
    renderWithHook();
    expect(screen.getByText('status')).toBeInTheDocument();
    expect(screen.getByText('duration')).toBeInTheDocument();
    expect(screen.getByText('input')).toBeInTheDocument();
  });

  it('switches to Order tab', async () => {
    renderWithHook();
    await userEvent.click(screen.getByText('Runs.Order'));
    // Order tab should show numbered positions
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('toggles checkbox', async () => {
    const { fieldSelector } = renderWithHook();
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeChecked();

    await userEvent.click(checkboxes[0]);

    expect(fieldSelector.current!.fieldVisibility['execution:status']).toBe(false);
  });

  it('collapses a section', async () => {
    renderWithHook();
    // Click the section header button
    const execHeader = screen.getByText('Runs.Execution').closest('button')!;
    await userEvent.click(execHeader);

    // Field names within Execution should be hidden
    expect(screen.queryByText('status')).not.toBeInTheDocument();
    // But other section fields should still be visible
    expect(screen.getByText('input')).toBeInTheDocument();
  });

  it('filters fields by search', async () => {
    renderWithHook();
    const searchInput = screen.getByPlaceholderText('Runs.Search');
    await userEvent.type(searchInput, 'input');

    // Only 'input' field should be visible
    expect(screen.getByText('input')).toBeInTheDocument();
    expect(screen.queryByText('status')).not.toBeInTheDocument();
  });
});
