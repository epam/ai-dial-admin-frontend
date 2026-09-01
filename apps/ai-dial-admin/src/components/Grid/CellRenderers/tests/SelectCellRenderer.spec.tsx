import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import SelectCellRenderer from '../SelectCellRenderer';

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialSelect: ({ value, onChange, options = [] }: any) => (
    <select role="combobox" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
      {options.map((option: any) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

const booleanItems = [
  { value: 'true', label: 'true' },
  { value: 'false', label: 'false' },
];

describe('SelectCellRenderer', () => {
  test('should keep the selected boolean value when the grid row stays stale', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const row = { data: { flag: true } };
    const { rerender } = render(
      <SelectCellRenderer
        value={true}
        items={booleanItems}
        onChange={onChange}
        data={row}
        colDef={{ field: 'flag' }}
      />,
    );

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('true');

    await user.selectOptions(select, 'false');
    expect(onChange).toHaveBeenCalledWith('false', row, 'flag', undefined, undefined);
    expect(select).toHaveValue('false');

    rerender(
      <SelectCellRenderer
        value={true}
        items={booleanItems}
        onChange={onChange}
        data={row}
        colDef={{ field: 'flag' }}
      />,
    );

    expect(screen.getByRole('combobox')).toHaveValue('false');
  });

  test('should take the incoming value when the grid row is replaced', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <SelectCellRenderer
        value={true}
        items={booleanItems}
        onChange={onChange}
        data={{ data: { flag: true } }}
        colDef={{ field: 'flag' }}
      />,
    );

    await user.selectOptions(screen.getByRole('combobox'), 'false');
    expect(screen.getByRole('combobox')).toHaveValue('false');

    rerender(
      <SelectCellRenderer
        value={true}
        items={booleanItems}
        onChange={onChange}
        data={{ data: { flag: true } }}
        colDef={{ field: 'flag' }}
      />,
    );

    expect(screen.getByRole('combobox')).toHaveValue('true');
  });
});
