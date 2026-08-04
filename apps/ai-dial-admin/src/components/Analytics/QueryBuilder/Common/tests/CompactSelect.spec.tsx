import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import CompactSelect from '@/src/components/Analytics/QueryBuilder/Common/CompactSelect';
import { SelectOption } from '@epam/ai-dial-ui-kit';

const OPTIONS = [
  { value: 'sum', label: 'SUM' },
  { value: 'avg', label: 'AVG' },
];

// The operator/direction shape: a full name shown in both the list and the trigger, plus a tooltip.
const NAMED_OPTIONS: SelectOption[] = [
  { value: 'eq', label: 'Equals', description: 'The field equals the given value.' },
  { value: 'ge', label: 'Greater than or equal' },
  { value: 'in', label: 'In list' },
];

describe('QueryBuilder :: CompactSelect', () => {
  test('shows the selected label and lists options on open', async () => {
    const user = userEvent.setup();
    render(<CompactSelect ariaLabel="Function" options={OPTIONS} value="sum" onChange={vi.fn()} />);

    const trigger = screen.getByRole('button', { name: 'Function' });
    expect(trigger).toHaveTextContent('SUM');

    await user.click(trigger);

    expect(screen.getByRole('option', { name: 'AVG' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'SUM' })).toHaveAttribute('aria-selected', 'true');
  });

  test('picking an option fires onChange and closes the list', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CompactSelect ariaLabel="Function" options={OPTIONS} value="sum" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Function' }));
    await user.click(screen.getByRole('option', { name: 'AVG' }));

    expect(onChange).toHaveBeenCalledWith('avg');
    expect(screen.queryByRole('option', { name: 'AVG' })).not.toBeInTheDocument();
  });

  test('renders the prefix before the selected label in the trigger', () => {
    render(<CompactSelect ariaLabel="Nulls" prefix="Nulls:" options={OPTIONS} value="sum" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Nulls' })).toHaveTextContent('Nulls: SUM');
  });

  test('the full name shows in both the trigger and the list', async () => {
    const user = userEvent.setup();
    render(<CompactSelect ariaLabel="Operator" options={NAMED_OPTIONS} value="ge" onChange={vi.fn()} />);

    const trigger = screen.getByRole('button', { name: 'Operator' });
    expect(trigger).toHaveTextContent('Greater than or equal');

    await user.click(trigger);

    expect(screen.getByRole('option', { name: 'Greater than or equal' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Equals' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'EQ' })).not.toBeInTheDocument();
  });

  test('an option with a description exposes it as a tooltip; one without does not', async () => {
    const user = userEvent.setup();
    render(<CompactSelect ariaLabel="Operator" options={NAMED_OPTIONS} value="eq" onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Operator' }));
    await user.hover(screen.getByRole('option', { name: 'Equals' }));
    expect(await screen.findByText('The field equals the given value.')).toBeInTheDocument();

    await user.hover(screen.getByRole('option', { name: 'In list' }));
    expect(screen.queryByText('The field equals the given value.')).not.toBeInTheDocument();
  });

  test('falls back to the raw value when no option matches', () => {
    render(<CompactSelect ariaLabel="Function" options={OPTIONS} value="unknown" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Function' })).toHaveTextContent('unknown');
  });
});
