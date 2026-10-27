import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { ICellRendererParams } from 'ag-grid-community';

import SkillSelectCellRenderer from '../SkillSelectCellRenderer';

vi.mock('@/src/components/Common/SkillSelectInput/SkillSelectInput', () => ({
  default: ({ value, onChangeValue, disabled }: any) => (
    <input
      aria-label="skill-input"
      disabled={disabled}
      value={value ?? ''}
      onChange={(e) => onChangeValue(e.target.value)}
    />
  ),
}));

// The renderer reads only the members each case sets; the rest of `ICellRendererParams` is grid-supplied.
const cellParams = {} as ICellRendererParams;
const mockNode = { rowIndex: 2 } as unknown as ICellRendererParams['node'];

describe('SkillSelectCellRenderer', () => {
  test('shows the new skill reference immediately and reports it to the grid', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const setValue = vi.fn();
    const row = { data: { skill: 'skills/public/a' } };

    render(
      <SkillSelectCellRenderer
        {...cellParams}
        value="skills/public/a"
        data={row}
        colDef={{ field: 'skill' }}
        node={mockNode}
        onChange={onChange}
        setValue={setValue}
      />,
    );

    const input = screen.getByLabelText('skill-input');
    expect(input).toHaveValue('skills/public/a');

    await user.type(input, 'b');

    expect(input).toHaveValue('skills/public/ab');
    expect(onChange).toHaveBeenLastCalledWith('skills/public/ab', row, 'skill', 2);
    expect(setValue).toHaveBeenLastCalledWith('skills/public/ab');
  });

  test('disables the picker when the cell is read-only', () => {
    render(
      <SkillSelectCellRenderer
        {...cellParams}
        value=""
        data={{}}
        colDef={{ field: 'skill' }}
        node={mockNode}
        isReadonly
      />,
    );

    expect(screen.getByLabelText('skill-input')).toBeDisabled();
  });
});
