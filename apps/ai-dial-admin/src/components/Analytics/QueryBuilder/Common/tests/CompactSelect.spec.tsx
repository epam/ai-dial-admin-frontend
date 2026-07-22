import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import CompactSelect from '@/src/components/Analytics/QueryBuilder/Common/CompactSelect';

const OPTIONS = [
  { value: 'sum', label: 'SUM' },
  { value: 'avg', label: 'AVG' },
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
});
